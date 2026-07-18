"""
Simulation Engine — Orchestrates the full "What If" analysis pipeline.

Pipeline:
1. Interpret natural language scenario via LLM
2. Query Knowledge Graph for relevant real-world data
3. Perform explainable calculations where data exists
4. Use LLM for directional estimates where data gaps exist
5. Compile results across all 5 impact axes
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
)
from app.services.knowledge_graph import knowledge_graph
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


class SimulationEngine:
    """Core simulation engine that combines KG calculations with LLM analysis."""

    def __init__(self) -> None:
        self._history: list[SimulationResult] = []

    async def simulate(
        self,
        query: str,
        parameters: Optional[dict[str, Any]] = None,
        language: str = "en",
    ) -> SimulationResult:
        """
        Run a full simulation for the given scenario.

        Args:
            query: Natural language scenario description
            parameters: Optional parameter overrides
            language: Language code for the output


        Returns:
            Complete SimulationResult with all 5 impact axes
        """
        start_time = time.time()
        parameters = parameters or {}

        logger.info("Starting simulation for: %s", query[:100])

        # Step 1: Interpret scenario
        interpreted = await llm_service.interpret_scenario(query)
        logger.info("Interpreted: %s", interpreted)

        # Step 2: Query Knowledge Graph
        kg_calculations = None
        domain = interpreted.get("domain", "general")

        if domain == "hyderabad_ev_traffic":
            vehicle_type = interpreted.get("vehicle_type", "two_wheelers") or "two_wheelers"
            timeline = interpreted.get("timeline")
            ban_year = int(timeline) if timeline and timeline.isdigit() else 2030

            kg_calculations = knowledge_graph.calculate_ev_ban_impact(
                vehicle_type=vehicle_type,
                ban_year=ban_year,
            )
            logger.info("KG calculations complete for %s", vehicle_type)

        # Step 3: Get domain summary for LLM context
        domain_summary = knowledge_graph.get_domain_summary(domain)

        # Step 4: Generate full impact analysis via LLM
        llm_analysis = await llm_service.generate_impact_analysis(
            query=query,
            kg_data=kg_calculations,
            interpreted_params=interpreted,
            language=language,
        )

        # Step 5: Build structured result
        impacts = self._build_impacts(llm_analysis.get("impacts", []), language)
        overall_summary = llm_analysis.get("overall_summary", "Analysis complete.")
        overall_score = llm_analysis.get("overall_score", 50.0)

        processing_time = (time.time() - start_time) * 1000

        result = SimulationResult(
            query=query,
            impacts=impacts,
            overall_summary=overall_summary,
            overall_score=overall_score,
            parameters_used={
                **parameters,
                "interpreted": interpreted,
                "domain": domain,
                "kg_available": kg_calculations is not None,
            },
            domain=domain,
            processing_time_ms=round(processing_time, 1),
        )

        # Save to history
        self._history.append(result)
        logger.info(
            "Simulation complete in %.0fms — score=%.1f, domain=%s",
            processing_time, overall_score, domain,
        )

        return result

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

    def get_history(self, limit: int = 50) -> list[SimulationResult]:
        """Get simulation history, most recent first."""
        return list(reversed(self._history[-limit:]))

    def get_scenario(self, scenario_id: str) -> Optional[SimulationResult]:
        """Find a specific scenario by ID."""
        for result in self._history:
            if result.id == scenario_id:
                return result
        return None

    def clear_history(self) -> int:
        """Clear all history. Returns count of cleared items."""
        count = len(self._history)
        self._history.clear()
        return count


# Singleton instance
simulation_engine = SimulationEngine()
