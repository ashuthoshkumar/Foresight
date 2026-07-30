"""
Simulation Engine — Orchestrates the full "What If" analysis pipeline.

Pipeline:
1. Detect city from query
2. Query Knowledge Graph for relevant city-specific data
3. Perform explainable calculations where data exists
4. Use LLM for impact analysis + stakeholder personas
5. Persist to SQLite database
"""

from __future__ import annotations

import logging
import time
from typing import Any, Optional

from app.models.scenario import (
    ConfidenceLevel,
    DataSource,
    ImpactAxis,
    ImpactCategory,
    ImpactDetail,
    SimulationResult,
    StakeholderPersona,
)
from app.services.knowledge_graph import knowledge_graph
from app.services.llm_service import llm_service
from app.services.database import db_service

logger = logging.getLogger(__name__)


class SimulationEngine:
    """Core simulation engine that combines KG calculations with LLM analysis."""

    async def simulate(
        self,
        query: str,
        parameters: Optional[dict[str, Any]] = None,
        language: str = "en",
    ) -> SimulationResult:
        start_time = time.time()
        parameters = parameters or {}

        logger.info("Starting simulation for: %s", query[:100])

        # ── Step 1: Detect city from query ──
        domain, city_name = knowledge_graph.detect_city(query)
        logger.info("Detected city: %s (domain: %s)", city_name, domain)

        # ── Step 2: Fast fallback interpretation ──
        interpreted = llm_service._fallback_interpret(query)
        # Override domain with detected city domain
        if domain:
            interpreted["domain"] = domain
            interpreted["location"] = city_name

        # ── Step 3: Query Knowledge Graph ──
        kg_calculations = None
        ev_keywords = ["ev", "electric", "petrol", "diesel", "bike", "car", "vehicle", "ban", "traffic", "transport", "bus", "metro"]
        query_lower = query.lower()
        is_ev_related = any(kw in query_lower for kw in ev_keywords)

        if domain and is_ev_related:
            vehicle_type = interpreted.get("vehicle_type", "two_wheelers") or "two_wheelers"
            timeline = interpreted.get("timeline")
            ban_year = int(timeline) if timeline and timeline.isdigit() else 2030
            kg_calculations = knowledge_graph.calculate_ev_ban_impact(
                vehicle_type=vehicle_type,
                ban_year=ban_year,
                domain=domain,
            )
            logger.info("KG calculations complete for %s in %s", vehicle_type, city_name)

        # ── Step 4: Single combined LLM call with live AQI context ──
        live_aqi_context = None
        if city_name:
            try:
                from app.services.live_api import fetch_live_aqi
                live_aqi_context = fetch_live_aqi(city_name)
            except Exception as e:
                logger.warning("Failed to fetch live AQI context: %s", e)

        llm_analysis = await llm_service.analyze_scenario_combined(
            query=query,
            kg_data=kg_calculations,
            language=language,
            city=city_name,
            live_aqi=live_aqi_context,
        )

        domain = llm_analysis.get("domain", domain)

        # ── Step 5: Build structured result ──
        impacts = self._build_impacts(llm_analysis.get("impacts", []), language)
        overall_summary = llm_analysis.get("overall_summary", "Analysis complete.")
        overall_score = llm_analysis.get("overall_score", 50.0)

        # Build stakeholder personas
        stakeholders = self._build_stakeholders(
            llm_analysis.get("stakeholders", []), city_name
        )

        processing_time = (time.time() - start_time) * 1000

        user_email = parameters.get("user_email")

        result = SimulationResult(
            query=query,
            impacts=impacts,
            overall_summary=overall_summary,
            overall_score=overall_score,
            parameters_used={
                **parameters,
                "interpreted": interpreted,
                "domain": domain,
                "city": city_name,
                "kg_available": kg_calculations is not None,
                "language": language,
            },
            domain=domain,
            city=city_name,
            processing_time_ms=round(processing_time, 1),
            stakeholders=stakeholders,
        )

        # Persist to database
        try:
            await db_service.save_scenario(result.model_dump(mode="json"), user_email)
        except Exception as e:
            logger.error("Failed to save scenario to DB: %s", e)

        logger.info(
            "Simulation complete in %.0fms — score=%.1f, domain=%s, city=%s",
            processing_time, overall_score, domain, city_name,
        )
        return result

    def _build_stakeholders(
        self, raw_stakeholders: list[dict[str, Any]], city: str
    ) -> list[StakeholderPersona]:
        """Convert raw LLM stakeholder data into typed models, with fallback."""
        stakeholders = []
        for raw in raw_stakeholders:
            try:
                stakeholders.append(StakeholderPersona(
                    name=raw.get("name", "Citizen"),
                    occupation=raw.get("occupation", "Resident"),
                    age=int(raw.get("age", 30)),
                    emoji=raw.get("emoji", "😐"),
                    quote=raw.get("quote", "This policy will affect my daily life."),
                    impact=raw.get("impact", "mixed"),
                ))
            except Exception as e:
                logger.warning("Skipping malformed stakeholder: %s", e)

        # If LLM didn't return any, generate fallbacks
        if not stakeholders:
            stakeholders = [
                StakeholderPersona(
                    name="Priya Sharma",
                    occupation="Local Café Owner",
                    age=34,
                    emoji="😰",
                    quote=f"My delivery costs in {city} could change dramatically. I need time to adapt my business model.",
                    impact="negative",
                ),
                StakeholderPersona(
                    name="Rahul Verma",
                    occupation="Daily Commuter",
                    age=28,
                    emoji="😊",
                    quote=f"If this means cleaner air and better public transport in {city}, I'm all for it!",
                    impact="positive",
                ),
                StakeholderPersona(
                    name="Sunita Devi",
                    occupation="Auto Driver",
                    age=45,
                    emoji="😤",
                    quote=f"Nobody asked us before making these decisions. How will I feed my family during the transition?",
                    impact="negative",
                ),
                StakeholderPersona(
                    name="Dr. Arun Nair",
                    occupation="Public Health Researcher",
                    age=52,
                    emoji="🤔",
                    quote=f"The health benefits are promising but will take 3-5 years to materialize in {city}'s population data.",
                    impact="mixed",
                ),
            ]
        return stakeholders

    def _build_impacts(self, raw_impacts: list[dict[str, Any]], language: str = "en") -> list[ImpactAxis]:
        """Convert raw LLM/fallback analysis into typed ImpactAxis models."""
        impacts = []

        is_hi = language.lower() == 'hi'
        is_te = language.lower() == 'te'
        
        def t_missing(cat_val: str) -> str:
            if is_hi:
                return f"{cat_val} के लिए कोई विशिष्ट विश्लेषण उपलब्ध नहीं है"
            if is_te:
                return f"{cat_val} కోసం ప్రత్యేక విశ్లేషణ ఏదీ అందుబాటులో లేదు"
            return f"No specific analysis available for {cat_val}"

        for raw in raw_impacts:
            try:
                category = ImpactCategory(raw["category"])
            except (ValueError, KeyError):
                continue

            details = []
            for d in raw.get("details", []):
                try:
                    details.append(ImpactDetail(
                        metric=d.get("metric", "Unknown"),
                        value=str(d.get("value", "N/A")),
                        explanation=d.get("explanation", ""),
                        confidence=ConfidenceLevel(d.get("confidence", "medium")),
                        source=DataSource(d.get("source", "llm_estimate")),
                    ))
                except (ValueError, KeyError) as e:
                    logger.warning("Skipping malformed detail: %s", e)

            # Determine primary data source for the axis
            kg_count = sum(1 for d in details if d.source == DataSource.KNOWLEDGE_GRAPH)
            primary_source = (
                DataSource.KNOWLEDGE_GRAPH
                if kg_count > len(details) / 2
                else DataSource.LLM_ESTIMATE
            )

            impacts.append(ImpactAxis(
                category=category,
                score=min(max(float(raw.get("score", 50)), 0), 100),
                summary=raw.get("summary", ""),
                details=details,
                data_source=DataSource(raw.get("data_source", primary_source.value)),
            ))

        # Ensure all 5 axes are present
        existing_categories = {i.category for i in impacts}
        for cat in ImpactCategory:
            if cat not in existing_categories:
                impacts.append(ImpactAxis(
                    category=cat,
                    score=50.0,
                    summary=t_missing(cat.value),
                    details=[],
                    data_source=DataSource.LLM_ESTIMATE,
                ))

        # Sort in canonical order
        category_order = list(ImpactCategory)
        impacts.sort(key=lambda i: category_order.index(i.category))

        return impacts

    async def get_history(self, limit: int = 50, user_email: Optional[str] = None) -> list[dict]:
        """Get simulation history from database."""
        return await db_service.get_history(limit=limit, user_email=user_email)

    async def get_scenario(self, scenario_id: str) -> Optional[dict]:
        """Find a specific scenario by ID from database."""
        return await db_service.get_scenario(scenario_id)


# Singleton instance
simulation_engine = SimulationEngine()
