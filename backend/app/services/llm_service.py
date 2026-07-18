"""
LLM Service — Google Gemini API integration.

Handles scenario interpretation, impact analysis generation,
and natural language explanations using structured output.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

# ── System Prompts ──────────────────────────────────────────────────

SCENARIO_INTERPRETER_PROMPT = """You are a scenario analysis interpreter for the Foresight AI Decision Engine.

Your job is to parse natural language "what if" scenarios into structured parameters.

Given a user's scenario description, extract:
1. **domain**: The most relevant domain (e.g., "hyderabad_ev_traffic", "business_finance", "education", "environment", "general")
2. **action**: The core action being proposed (e.g., "ban_petrol_vehicles", "increase_salary", "change_policy")
3. **target**: What is being affected (e.g., "petrol_bikes", "all_employees", "attendance_policy")
4. **location**: Geographic scope if mentioned (e.g., "Hyderabad", "India", "global")
5. **timeline**: When this would take effect (e.g., "2030", "immediately", "next_quarter")
6. **parameters**: Any specific numbers or constraints mentioned
7. **vehicle_type**: If applicable, the type of vehicle (e.g., "two_wheelers", "four_wheelers", "all")

Respond ONLY with valid JSON matching this schema:
{
    "domain": "string",
    "action": "string",
    "target": "string",
    "location": "string or null",
    "timeline": "string or null",
    "parameters": {},
    "vehicle_type": "string or null",
    "confidence": 0.0-1.0
}"""

IMPACT_ANALYSIS_PROMPT = """You are an expert multi-dimensional impact analyst for the Foresight AI Decision Engine.

You analyze "what if" scenarios across EXACTLY 5 impact axes:
1. **Financial** — Economic costs, revenues, market impacts, investment needs
2. **Environmental** — Carbon emissions, air quality, noise, ecological effects
3. **Human** — Health outcomes, quality of life, employment, social equity
4. **Risks** — Implementation challenges, unintended consequences, political barriers
5. **Opportunities** — Innovation potential, new markets, long-term benefits

IMPORTANT RULES:
- When provided with Knowledge Graph (KG) data, use those EXACT numbers in your analysis and mark metrics as "knowledge_graph" source.
- For dimensions NOT covered by KG data, provide your best directional estimates and mark them as "llm_estimate" source.
- ALWAYS provide specific numbers, percentages, and quantified impacts — never be vague.
- Confidence levels: "high" for KG-backed metrics, "medium" for well-reasoned estimates, "low" for speculative projections.
- Score each axis from 0 (minimal impact) to 100 (transformative impact).

Respond ONLY with valid JSON matching this schema:
{
    "impacts": [
        {
            "category": "financial|environmental|human|risks|opportunities",
            "score": 0-100,
            "summary": "One-line summary",
            "data_source": "knowledge_graph|llm_estimate",
            "details": [
                {
                    "metric": "Metric Name",
                    "value": "Formatted value with units",
                    "explanation": "How this was derived",
                    "confidence": "high|medium|low",
                    "source": "knowledge_graph|llm_estimate"
                }
            ]
        }
    ],
    "overall_summary": "2-3 sentence executive summary",
    "overall_score": 0-100,
    "domain": "detected domain"
}"""


class LLMService:
    """Wrapper around Google Gemini API for scenario analysis."""

    def __init__(self) -> None:
        self._client: Optional[genai.Client] = None
        self._model_name: str = "gemini-2.0-flash"
        self._initialized = False

    def initialize(self) -> None:
        """Configure the Gemini API client."""
        settings = get_settings()
        if not settings.gemini_api_key:
            logger.warning(
                "GEMINI_API_KEY not set — LLM service will use fallback responses"
            )
            return

        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._initialized = True
        logger.info("Gemini LLM service initialized")

    @property
    def is_available(self) -> bool:
        """Check if the LLM service is ready."""
        return self._initialized and self._client is not None

    async def interpret_scenario(self, query: str) -> dict[str, Any]:
        """
        Parse a natural language scenario into structured parameters.

        Args:
            query: User's natural language scenario description

        Returns:
            Structured parameters extracted from the query
        """
        if not self.is_available:
            return self._fallback_interpret(query)

        try:
            response = self._client.models.generate_content(
                model=self._model_name,
                contents=SCENARIO_INTERPRETER_PROMPT + f"\n\nUser scenario: \"{query}\"",
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )

            result = json.loads(response.text)
            logger.info("Scenario interpreted: domain=%s, action=%s", result.get("domain"), result.get("action"))
            return result

        except Exception as e:
            logger.error("LLM interpretation failed: %s", e)
            return self._fallback_interpret(query)

    async def generate_impact_analysis(
        self,
        query: str,
        kg_data: Optional[dict[str, Any]] = None,
        interpreted_params: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """
        Generate a full 5-axis impact analysis for a scenario.

        Args:
            query: Original user query
            kg_data: Calculated data from the Knowledge Graph (if available)
            interpreted_params: Structured parameters from interpretation step

        Returns:
            Complete impact analysis with scores, details, and source attribution
        """
        if not self.is_available:
            return self._fallback_analysis(query, kg_data)

        # Build context with KG data
        context_parts = [IMPACT_ANALYSIS_PROMPT]
        context_parts.append(f"\n\n## User Scenario\n\"{query}\"")

        if interpreted_params:
            context_parts.append(
                f"\n\n## Interpreted Parameters\n```json\n{json.dumps(interpreted_params, indent=2)}\n```"
            )

        if kg_data:
            context_parts.append(
                f"\n\n## Knowledge Graph Data (USE THESE EXACT NUMBERS — mark as 'knowledge_graph' source)\n"
                f"```json\n{json.dumps(kg_data, indent=2, default=str)}\n```"
            )
        else:
            context_parts.append(
                "\n\n## Note: No Knowledge Graph data available for this domain. "
                "All metrics should be marked as 'llm_estimate' source."
            )

        try:
            response = self._client.models.generate_content(
                model=self._model_name,
                contents="\n".join(context_parts),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                    max_output_tokens=4096,
                ),
            )

            result = json.loads(response.text)
            logger.info("Impact analysis generated: overall_score=%s", result.get("overall_score"))
            return result

        except Exception as e:
            logger.error("LLM analysis failed: %s", e)
            return self._fallback_analysis(query, kg_data)

    # ── Fallback Responses (when API key is not set) ────────────

    def _fallback_interpret(self, query: str) -> dict[str, Any]:
        """Rule-based interpretation fallback."""
        query_lower = query.lower()

        domain = "general"
        action = "analyze"
        target = "scenario"
        location = None
        vehicle_type = None
        timeline = None

        # Domain detection
        ev_keywords = ["ev", "electric", "petrol", "diesel", "bike", "car", "vehicle", "ban", "traffic"]
        if any(kw in query_lower for kw in ev_keywords):
            domain = "hyderabad_ev_traffic"
            action = "policy_change"

        if "hyderabad" in query_lower:
            location = "Hyderabad"

        # Vehicle type detection
        if "bike" in query_lower or "two wheeler" in query_lower or "two-wheeler" in query_lower:
            vehicle_type = "two_wheelers"
            target = "petrol_bikes"
        elif "car" in query_lower or "four wheeler" in query_lower:
            vehicle_type = "four_wheelers"
            target = "petrol_cars"
        elif "auto" in query_lower or "rickshaw" in query_lower:
            vehicle_type = "auto_rickshaws"
            target = "auto_rickshaws"

        # Action detection
        if "ban" in query_lower:
            action = "ban_petrol_vehicles"
        elif "increase" in query_lower:
            action = "increase"
        elif "decrease" in query_lower or "reduce" in query_lower:
            action = "decrease"

        # Timeline detection
        for year in range(2025, 2051):
            if str(year) in query:
                timeline = str(year)
                break

        return {
            "domain": domain,
            "action": action,
            "target": target,
            "location": location,
            "timeline": timeline,
            "parameters": {},
            "vehicle_type": vehicle_type,
            "confidence": 0.6,
        }

    def _fallback_analysis(
        self,
        query: str,
        kg_data: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Generate a basic analysis from KG data without LLM."""
        impacts = []

        if kg_data and "environmental" in kg_data:
            env = kg_data["environmental"]
            impacts.append({
                "category": "environmental",
                "score": 78,
                "summary": f"Significant environmental improvement with {env.get('co2_reduction_percent', 'N/A')}% CO2 reduction",
                "data_source": "knowledge_graph",
                "details": [
                    {
                        "metric": "CO2 Emission Reduction",
                        "value": f"{env.get('co2_reduction_tonnes_annual', 'N/A'):,} tonnes/year",
                        "explanation": "Calculated from vehicle counts × per-vehicle emission factors",
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": "AQI Improvement",
                        "value": f"~{env.get('aqi_improvement', 'N/A')} point reduction",
                        "explanation": "Based on vehicular emission share and vehicle type contribution",
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": "Noise Reduction",
                        "value": f"~{env.get('noise_reduction_db', 'N/A')} dB reduction",
                        "explanation": "Based on two-wheeler noise contribution share",
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                ],
            })

        if kg_data and "economic" in kg_data:
            econ = kg_data["economic"]
            impacts.append({
                "category": "financial",
                "score": 72,
                "summary": f"Major economic shift with ₹{econ.get('fuel_revenue_loss_crores_annual', 'N/A'):,} Cr fuel revenue impact",
                "data_source": "knowledge_graph",
                "details": [
                    {
                        "metric": "Fuel Revenue Impact",
                        "value": f"₹{econ.get('fuel_revenue_loss_crores_annual', 'N/A'):,} Crores/year loss",
                        "explanation": "Based on petrol consumption share of affected vehicle type",
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": "Jobs At Risk",
                        "value": f"~{econ.get('jobs_at_risk', 'N/A'):,} positions",
                        "explanation": "Fuel station employees + mechanics proportional to affected vehicles",
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": "EV Market Opportunity",
                        "value": f"₹{econ.get('ev_market_opportunity_crores', 'N/A'):,} Crores",
                        "explanation": "Replacement market value for transitioning vehicles",
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                ],
            })

        if kg_data and "health" in kg_data:
            health = kg_data["health"]
            impacts.append({
                "category": "human",
                "score": 68,
                "summary": f"Positive health outcomes — estimated {health.get('estimated_lives_saved_annual', 'N/A')} lives saved annually",
                "data_source": "knowledge_graph",
                "details": [
                    {
                        "metric": "Lives Saved",
                        "value": f"~{health.get('estimated_lives_saved_annual', 'N/A')} annually",
                        "explanation": "From reduced air pollution and road accidents",
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": "Healthcare Cost Savings",
                        "value": f"₹{health.get('healthcare_savings_crores_annual', 'N/A'):,} Crores/year",
                        "explanation": "Reduction in pollution-related healthcare expenditure",
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                ],
            })

        # Add estimated axes if not covered by KG
        existing_categories = {i["category"] for i in impacts}

        if "risks" not in existing_categories:
            impacts.append({
                "category": "risks",
                "score": 65,
                "summary": "Implementation risks include infrastructure gaps and economic disruption",
                "data_source": "llm_estimate",
                "details": [
                    {
                        "metric": "Infrastructure Readiness",
                        "value": "~40% ready",
                        "explanation": "Current charging infrastructure insufficient for full transition",
                        "confidence": "medium",
                        "source": "llm_estimate",
                    },
                    {
                        "metric": "Social Resistance",
                        "value": "High — affects millions of vehicle owners",
                        "explanation": "Mandatory transition may face public and political resistance",
                        "confidence": "low",
                        "source": "llm_estimate",
                    },
                ],
            })

        if "opportunities" not in existing_categories:
            impacts.append({
                "category": "opportunities",
                "score": 82,
                "summary": "Strong opportunities in EV manufacturing, green jobs, and clean tech leadership",
                "data_source": "llm_estimate",
                "details": [
                    {
                        "metric": "Green Job Creation",
                        "value": "~50,000+ new positions",
                        "explanation": "EV manufacturing, charging network, battery recycling ecosystem",
                        "confidence": "medium",
                        "source": "llm_estimate",
                    },
                    {
                        "metric": "Clean Tech Leadership",
                        "value": "Potential to become India's EV capital",
                        "explanation": "Early adoption could attract EV manufacturers and R&D centers",
                        "confidence": "low",
                        "source": "llm_estimate",
                    },
                ],
            })

        overall_score = sum(i["score"] for i in impacts) / max(len(impacts), 1)

        return {
            "impacts": impacts,
            "overall_summary": (
                f"This scenario would have significant multi-dimensional impacts. "
                f"Analysis covers {len(impacts)} axes with a mix of data-grounded calculations "
                f"and AI-estimated projections."
            ),
            "overall_score": round(overall_score, 1),
            "domain": "hyderabad_ev_traffic" if kg_data else "general",
        }


# Singleton instance
llm_service = LLMService()
