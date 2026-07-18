"""Pydantic models for scenarios and simulation results."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class DataSource(str, Enum):
    """Source of a data point — calculated from KG or estimated by LLM."""
    KNOWLEDGE_GRAPH = "knowledge_graph"
    LLM_ESTIMATE = "llm_estimate"


class ConfidenceLevel(str, Enum):
    """Confidence level for impact predictions."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ImpactCategory(str, Enum):
    """The five impact axes for scenario analysis."""
    FINANCIAL = "financial"
    ENVIRONMENTAL = "environmental"
    HUMAN = "human"
    RISKS = "risks"
    OPPORTUNITIES = "opportunities"


# ── Request Models ──────────────────────────────────────────────


class ScenarioRequest(BaseModel):
    """Input model for creating a new simulation."""
    query: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="Natural language scenario description",
        json_schema_extra={"examples": ["What if Hyderabad banned petrol bikes by 2030?"]},
    )
    parameters: dict[str, Any] = Field(
        default_factory=dict,
        description="Optional parameter overrides for the simulation",
    )
    language: str = Field(
        default="en",
        description="Language code for the output (e.g. 'en', 'hi', 'te')"
    )


# ── Response Models ─────────────────────────────────────────────


class ImpactDetail(BaseModel):
    """A single metric within an impact axis."""
    metric: str = Field(..., description="Name of the metric (e.g., 'CO2 Reduction')")
    value: str = Field(..., description="Formatted value (e.g., '~35% reduction')")
    explanation: str = Field(..., description="Human-readable explanation of how this was derived")
    confidence: ConfidenceLevel = Field(
        default=ConfidenceLevel.MEDIUM,
        description="Confidence level of this prediction",
    )
    source: DataSource = Field(
        ...,
        description="Whether this metric was calculated from data or estimated by the LLM",
    )


class ImpactAxis(BaseModel):
    """Results for one of the five impact categories."""
    category: ImpactCategory
    score: float = Field(
        ..., ge=0, le=100,
        description="Impact score from 0 (minimal) to 100 (transformative)",
    )
    summary: str = Field(..., description="One-line summary of this axis's impact")
    details: list[ImpactDetail] = Field(default_factory=list)
    data_source: DataSource = Field(
        ...,
        description="Primary data source for this axis — KG if >50% metrics are calculated",
    )


class SimulationResult(BaseModel):
    """Complete simulation output for a scenario."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    impacts: list[ImpactAxis] = Field(default_factory=list)
    overall_summary: str = Field(default="", description="Executive summary of all impacts")
    overall_score: float = Field(
        default=50.0, ge=0, le=100,
        description="Weighted overall impact score",
    )
    parameters_used: dict[str, Any] = Field(default_factory=dict)
    domain: str = Field(default="general", description="Detected scenario domain")
    processing_time_ms: Optional[float] = None


class SimulationResponse(BaseModel):
    """API response wrapper for simulation results."""
    success: bool = True
    result: SimulationResult
    message: str = "Simulation completed successfully"


class HistoryResponse(BaseModel):
    """API response for scenario history."""
    success: bool = True
    scenarios: list[SimulationResult]
    total: int


class ErrorResponse(BaseModel):
    """Standardized error response."""
    success: bool = False
    message: str
    detail: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    scenario_query: str
    message: str
    history: list[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    success: bool = True
    reply: str
    error: Optional[str] = None
