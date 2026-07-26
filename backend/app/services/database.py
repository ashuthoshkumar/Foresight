"""
Database Service — SQLite persistence via aiosqlite.

Stores simulation history, bookmarks, share links, and leaderboard data
so they survive server restarts.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Optional

import aiosqlite

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "foresight.db")


class DatabaseService:
    """Async SQLite wrapper for Foresight persistence."""

    def __init__(self) -> None:
        self._db_path = DB_PATH

    async def initialize(self) -> None:
        """Create tables if they don't exist."""
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS scenarios (
                    id TEXT PRIMARY KEY,
                    query TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    domain TEXT DEFAULT 'general',
                    city TEXT DEFAULT 'Hyderabad',
                    overall_score REAL DEFAULT 50.0,
                    overall_summary TEXT DEFAULT '',
                    processing_time_ms REAL,
                    result_json TEXT NOT NULL,
                    user_email TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            """)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS bookmarks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scenario_id TEXT NOT NULL,
                    user_email TEXT NOT NULL,
                    created_at TEXT DEFAULT (datetime('now')),
                    UNIQUE(scenario_id, user_email)
                )
            """)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS shares (
                    short_id TEXT PRIMARY KEY,
                    result_json TEXT NOT NULL,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            """)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS leaderboard (
                    scenario_query TEXT PRIMARY KEY,
                    domain TEXT DEFAULT 'general',
                    best_score REAL DEFAULT 0,
                    run_count INTEGER DEFAULT 1,
                    last_run TEXT DEFAULT (datetime('now'))
                )
            """)
            await db.commit()
        logger.info("Database initialized at %s", self._db_path)

    # ── Scenarios ───────────────────────────────────────────────

    async def save_scenario(self, result: dict, user_email: Optional[str] = None) -> None:
        """Persist a simulation result."""
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute(
                """INSERT OR REPLACE INTO scenarios
                   (id, query, timestamp, domain, city, overall_score, overall_summary,
                    processing_time_ms, result_json, user_email)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    result["id"],
                    result["query"],
                    result.get("timestamp", ""),
                    result.get("domain", "general"),
                    result.get("parameters_used", {}).get("city", "Hyderabad"),
                    result.get("overall_score", 50.0),
                    result.get("overall_summary", ""),
                    result.get("processing_time_ms"),
                    json.dumps(result, default=str),
                    user_email,
                ),
            )
            # Update leaderboard
            await db.execute(
                """INSERT INTO leaderboard (scenario_query, domain, best_score, run_count, last_run)
                   VALUES (?, ?, ?, 1, datetime('now'))
                   ON CONFLICT(scenario_query) DO UPDATE SET
                       run_count = run_count + 1,
                       best_score = MAX(best_score, excluded.best_score),
                       last_run = datetime('now')""",
                (result["query"], result.get("domain", "general"), result.get("overall_score", 50.0)),
            )
            await db.commit()

    async def get_history(self, limit: int = 50, user_email: Optional[str] = None) -> list[dict]:
        """Get recent simulation results, most recent first."""
        async with aiosqlite.connect(self._db_path) as db:
            db.row_factory = aiosqlite.Row
            if user_email:
                cursor = await db.execute(
                    "SELECT result_json FROM scenarios WHERE user_email = ? ORDER BY created_at DESC LIMIT ?",
                    (user_email, limit),
                )
            else:
                cursor = await db.execute(
                    "SELECT result_json FROM scenarios ORDER BY created_at DESC LIMIT ?",
                    (limit,),
                )
            rows = await cursor.fetchall()
            return [json.loads(row[0]) for row in rows]

    async def get_scenario(self, scenario_id: str) -> Optional[dict]:
        """Get a single scenario by ID."""
        async with aiosqlite.connect(self._db_path) as db:
            cursor = await db.execute(
                "SELECT result_json FROM scenarios WHERE id = ?", (scenario_id,)
            )
            row = await cursor.fetchone()
            return json.loads(row[0]) if row else None

    # ── Bookmarks ───────────────────────────────────────────────

    async def toggle_bookmark(self, scenario_id: str, user_email: str) -> bool:
        """Toggle bookmark. Returns True if bookmarked, False if removed."""
        async with aiosqlite.connect(self._db_path) as db:
            cursor = await db.execute(
                "SELECT id FROM bookmarks WHERE scenario_id = ? AND user_email = ?",
                (scenario_id, user_email),
            )
            existing = await cursor.fetchone()
            if existing:
                await db.execute(
                    "DELETE FROM bookmarks WHERE scenario_id = ? AND user_email = ?",
                    (scenario_id, user_email),
                )
                await db.commit()
                return False
            else:
                await db.execute(
                    "INSERT INTO bookmarks (scenario_id, user_email) VALUES (?, ?)",
                    (scenario_id, user_email),
                )
                await db.commit()
                return True

    async def get_bookmarks(self, user_email: str) -> list[dict]:
        """Get all bookmarked scenarios for a user."""
        async with aiosqlite.connect(self._db_path) as db:
            cursor = await db.execute(
                """SELECT s.result_json FROM bookmarks b
                   JOIN scenarios s ON b.scenario_id = s.id
                   WHERE b.user_email = ?
                   ORDER BY b.created_at DESC""",
                (user_email,),
            )
            rows = await cursor.fetchall()
            return [json.loads(row[0]) for row in rows]

    async def is_bookmarked(self, scenario_id: str, user_email: str) -> bool:
        """Check if a scenario is bookmarked by a user."""
        async with aiosqlite.connect(self._db_path) as db:
            cursor = await db.execute(
                "SELECT 1 FROM bookmarks WHERE scenario_id = ? AND user_email = ?",
                (scenario_id, user_email),
            )
            return await cursor.fetchone() is not None

    # ── Shares ──────────────────────────────────────────────────

    async def save_share(self, short_id: str, result: dict) -> None:
        """Save a shared simulation result."""
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute(
                "INSERT OR REPLACE INTO shares (short_id, result_json) VALUES (?, ?)",
                (short_id, json.dumps(result, default=str)),
            )
            await db.commit()

    async def get_share(self, short_id: str) -> Optional[dict]:
        """Get a shared result by short ID."""
        async with aiosqlite.connect(self._db_path) as db:
            cursor = await db.execute(
                "SELECT result_json FROM shares WHERE short_id = ?", (short_id,)
            )
            row = await cursor.fetchone()
            return json.loads(row[0]) if row else None

    # ── Leaderboard ─────────────────────────────────────────────

    async def get_leaderboard(self, limit: int = 10) -> list[dict]:
        """Get top scenarios ranked by score and popularity."""
        async with aiosqlite.connect(self._db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                """SELECT scenario_query, domain, best_score, run_count
                   FROM leaderboard
                   ORDER BY best_score DESC, run_count DESC
                   LIMIT ?""",
                (limit,),
            )
            rows = await cursor.fetchall()
            return [
                {
                    "id": f"lb-{i}",
                    "query": row[0],
                    "domain": row[1] or "general",
                    "score": row[2],
                    "popularity_count": row[3],
                }
                for i, row in enumerate(rows)
            ]


# Singleton
db_service = DatabaseService()
