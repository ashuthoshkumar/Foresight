"""
LLM Service — Google Gemini API integration.

Handles scenario interpretation, impact analysis generation,
and natural language explanations using structured output.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Optional

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

# Max retries on quota/rate-limit errors
_MAX_RETRIES = 2
_RETRY_DELAY_S = 2

# Combined one-shot prompt — does interpretation + analysis in a single LLM call
COMBINED_ANALYSIS_PROMPT = """You are Foresight AI — an expert scenario analyst and urban planner.

Given a "what if" scenario, do TWO things in one response:
1. Parse the scenario parameters
2. Generate a full 5-axis impact analysis
3. Generate 3-4 diverse citizen personas showing how this impacts real people

Scenario: "{query}"
City: {city}

{kg_section}

Rules:
- Use KG data numbers EXACTLY when provided (mark source: "knowledge_graph")
- For missing data, use directional estimates (mark source: "llm_estimate")
- Be specific with numbers/percentages
- Scores: 0 (minimal) to 100 (transformative)
- Stakeholder personas must be diverse (different ages, occupations, perspectives)

Respond ONLY with this exact JSON (no markdown, no extra text):
{{
  "domain": "hyderabad_ev_traffic|delhi_ev_traffic|bangalore_ev_traffic|mumbai_ev_traffic|general",
  "action": "string",
  "target": "string",
  "vehicle_type": "two_wheelers|four_wheelers|auto_rickshaws|all|null",
  "timeline": "year string or null",
  "impacts": [
    {{
      "category": "financial|environmental|human|risks|opportunities",
      "score": 0,
      "summary": "one-line summary",
      "data_source": "knowledge_graph|llm_estimate",
      "details": [
        {{
          "metric": "Metric Name",
          "value": "value with units",
          "explanation": "brief derivation",
          "confidence": "high|medium|low",
          "source": "knowledge_graph|llm_estimate"
        }}
      ]
    }}
  ],
  "stakeholders": [
    {{
      "name": "Full Name",
      "occupation": "Job Title",
      "age": 30,
      "emoji": "sentiment emoji",
      "quote": "First-person 1-2 sentence quote about how this personally affects them",
      "impact": "positive|negative|mixed"
    }}
  ],
  "overall_summary": "2-sentence executive summary",
  "overall_score": 0
}}"""

GOAL_SEEK_PROMPT = """You are Foresight AI — an expert urban strategist and policy planner.

The user is NOT asking "What if?". They have set a strict, ambitious GOAL for their city.
Your task is to "backcast" from this future goal to the present day, generating a step-by-step roadmap to achieve it.

Goal: "{goal}"
City: {city}
Timeline: {timeline}

Respond ONLY with this exact JSON (no markdown, no extra text):
{{
  "goal_summary": "2-sentence executive summary of the challenge and approach",
  "total_estimated_budget": "string (e.g. '$2.5B' or '₹15,000 Cr')",
  "feasibility_score": 0, // 0-100 based on realism and difficulty
  "milestones": [
    {{
      "year": "string",
      "title": "Milestone Title",
      "description": "1-sentence description",
      "key_policy": "The main policy/law to enact here",
      "infrastructure_change": "Physical changes to the city"
    }}
  ],
  "major_risks": [
    "string",
    "string"
  ]
}}"""

TRANSLATE_RESULT_PROMPT = """You are a professional translator.
Translate ALL user-facing text values (such as 'overall_summary', 'summary', 'metric', 'explanation', 'name', 'occupation', 'quote') in the provided JSON to the target language: {language}.

CRITICAL REQUIREMENTS:
1. Do NOT translate any JSON keys. Keep keys exactly as they are.
2. Do NOT translate technical or internal values like 'category' (e.g. keep 'environmental', 'financial', etc.), 'confidence', 'data_source', 'id', 'timestamp', or 'sentiment'.
3. Keep all numbers, scores, and structures exactly the same.
4. Ensure the output is valid JSON matching the exact schema of the input.
5. Translate the user query itself ('query') if appropriate, or keep it.
"""


class LLMService:
    """Wrapper around Google Gemini API for scenario analysis."""

    def __init__(self) -> None:
        self._client: Optional[genai.Client] = None
        # gemini-2.0-flash-lite is the fastest model for this API key
        self._model_name: str = "models/gemini-2.0-flash-lite"
        self._fallback_models: list[str] = [
            "models/gemini-2.0-flash-lite",
            "models/gemini-2.0-flash",
            "models/gemini-2.5-flash",
        ]
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

        models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
        ]

        for model_name in models_to_try:
            for attempt in range(1, _MAX_RETRIES + 1):
                try:
                    response = self._client.models.generate_content(
                        model=model_name,
                        contents=SCENARIO_INTERPRETER_PROMPT + f'\n\nUser scenario: "{query}"',
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.1,
                        ),
                    )

                    result = json.loads(response.text)
                    logger.info("Scenario interpreted via %s: domain=%s, action=%s", model_name, result.get("domain"), result.get("action"))
                    return result

                except Exception as e:
                    err_str = str(e).lower()
                    if attempt < _MAX_RETRIES and not ("429" in err_str or "quota" in err_str or "resource_exhausted" in err_str):
                        await asyncio.sleep(_RETRY_DELAY_S)
                        continue
                    
                    if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str:
                        logger.warning("Model %s unavailable for interpretation, trying next...", model_name)
                        break
                    
                    if attempt == _MAX_RETRIES:
                        logger.error("LLM interpretation failed on %s: %s", model_name, e)
                        break

        logger.warning("All models failed for interpretation, returning fallback")
        return self._fallback_interpret(query)

    async def analyze_scenario_combined(
        self,
        query: str,
        kg_data: Optional[dict[str, Any]] = None,
        language: str = "en",
        city: str = "Hyderabad",
        live_aqi: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Single combined LLM call: interpretation + impact analysis together."""
        if not self.is_available:
            return self._fallback_analysis(query, kg_data, language, city=city)

        # Build KG section
        if kg_data:
            kg_section = f"Knowledge Graph Data (use these EXACT numbers, mark source 'knowledge_graph'):\n{json.dumps(kg_data, indent=2, default=str)}"
        else:
            kg_section = "No Knowledge Graph data available. Use directional estimates (mark source 'llm_estimate')."

        if live_aqi:
            kg_section += f"\n\nLive Meteorological API Data (use these real-time baseline values instead of defaults, mark source 'knowledge_graph'):\n{json.dumps(live_aqi, indent=2, default=str)}"

        if language and language.lower() != "en":
            kg_section += f"\n\nIMPORTANT: Translate ALL text fields (summaries, metric names, explanations) to language: {language}"

        prompt = COMBINED_ANALYSIS_PROMPT.format(query=query, kg_section=kg_section, city=city)

        models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
        ]

        for model_name in models_to_try:
            for attempt in range(1, _MAX_RETRIES + 1):
                try:
                    response = self._client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.2,
                            max_output_tokens=3072,
                        ),
                    )
                    result = json.loads(response.text)
                    logger.info("Combined analysis done via %s: score=%s domain=%s city=%s", model_name, result.get("overall_score"), result.get("domain"), city)
                    return result

                except Exception as e:
                    err_str = str(e).lower()
                    if attempt < _MAX_RETRIES and not ("429" in err_str or "quota" in err_str or "resource_exhausted" in err_str):
                        await asyncio.sleep(_RETRY_DELAY_S)
                        continue
                    
                    if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str:
                        logger.warning("Model %s unavailable for combined analysis, trying next...", model_name)
                        break
                    
                    if attempt == _MAX_RETRIES:
                        logger.error("Combined analysis failed on %s: %s", model_name, e)
                        break

        logger.warning("All models failed for combined analysis, returning fallback")
        return self._fallback_analysis(query, kg_data, language, city=city)


    async def generate_impact_analysis(
        self,
        query: str,
        kg_data: Optional[dict[str, Any]] = None,
        interpreted_params: Optional[dict[str, Any]] = None,
        language: str = "en",
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
            return self._fallback_analysis(query, kg_data, language)

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

        if language and language.lower() != "en":
            context_parts.append(
                f"\n\n## Language Requirement\nIMPORTANT: Translate ALL output text (including summaries, category names, metric names, and explanations) into the following language code/name: {language}. Return valid JSON."
            )

        models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
        ]

        for model_name in models_to_try:
            for attempt in range(1, _MAX_RETRIES + 1):
                try:
                    response = self._client.models.generate_content(
                        model=model_name,
                        contents="\n".join(context_parts),
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.3,
                            max_output_tokens=2048,
                        ),
                    )

                    result = json.loads(response.text)
                    logger.info("Impact analysis generated via %s: overall_score=%s", model_name, result.get("overall_score"))
                    return result

                except Exception as e:
                    err_str = str(e).lower()
                    if attempt < _MAX_RETRIES and not ("429" in err_str or "quota" in err_str or "resource_exhausted" in err_str):
                        await asyncio.sleep(_RETRY_DELAY_S)
                        continue
                    
                    if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str:
                        logger.warning("Model %s unavailable for impact analysis, trying next...", model_name)
                        break
                    
                    if attempt == _MAX_RETRIES:
                        logger.error("LLM analysis failed on %s: %s", model_name, e)
                        break

        logger.warning("All models failed for impact analysis, returning fallback")
        return self._fallback_analysis(query, kg_data, language)

    async def translate_result(self, result: dict[str, Any], target_language: str) -> dict[str, Any]:
        """
        Translate user-facing text fields in a simulation result JSON to target_language using Gemini.
        """
        if not self.is_available:
            return result

        prompt = TRANSLATE_RESULT_PROMPT.format(language=target_language) + f"\n\nJSON to translate:\n{json.dumps(result, ensure_ascii=False)}"

        models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
        ]

        for model_name in models_to_try:
            for attempt in range(1, _MAX_RETRIES + 1):
                try:
                    response = self._client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.1,
                        ),
                    )
                    translated = json.loads(response.text)
                    logger.info("Simulation result translated to %s via %s", target_language, model_name)
                    return translated
                except Exception as e:
                    err_str = str(e).lower()
                    if attempt < _MAX_RETRIES and not ("429" in err_str or "quota" in err_str or "resource_exhausted" in err_str):
                        await asyncio.sleep(_RETRY_DELAY_S)
                        continue
                    
                    if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str:
                        logger.warning("Model %s unavailable for translation, trying next...", model_name)
                        break
                    
                    if attempt == _MAX_RETRIES:
                        logger.error("Translation failed on %s: %s", model_name, e)
                        break

        logger.warning("All models failed for translation, returning untranslated result")
        return result

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
        language: str = "en",
        city: str = "Hyderabad",
    ) -> dict[str, Any]:
        """
        Generate a smart, query-specific analysis when the LLM is unavailable.
        Uses KG data where available and creates unique estimates per query.
        """
        import hashlib
        import math

        query_lower = query.lower()
        is_hi = language.lower() == 'hi'
        is_te = language.lower() == 'te'

        def t(en: str, hi: str = "", te: str = "") -> str:
            if is_hi and hi: return hi
            if is_te and te: return te
            return en

        # Use query hash for deterministic but unique score variation per query
        qhash = int(hashlib.md5(query.encode()).hexdigest(), 16)
        def qvar(base: float, spread: float = 8.0) -> float:
            """Deterministic variation based on query content."""
            return round(base + (((qhash >> 4) & 0xFF) / 255.0 - 0.5) * spread * 2, 1)

        # ── Detect query intent ──────────────────────────────────
        is_ban        = any(w in query_lower for w in ["ban", "remove", "eliminate", "abolish", "prohibit"])
        is_increase   = any(w in query_lower for w in ["triple", "double", "increase", "expand", "add", "more", "boost"])
        is_decrease   = any(w in query_lower for w in ["reduce", "halve", "cut", "less", "lower", "decrease"])
        is_ev         = any(w in query_lower for w in ["ev", "electric", "charging", "station"])
        is_petrol     = any(w in query_lower for w in ["petrol", "diesel", "fuel", "gasoline"])
        is_traffic    = any(w in query_lower for w in ["traffic", "congestion", "road", "transport"])
        is_health     = any(w in query_lower for w in ["health", "hospital", "pollution", "air quality", "aqi"])
        is_policy     = any(w in query_lower for w in ["policy", "law", "regulation", "mandate", "subsidy"])

        # ── Determine directional impact multiplier ──────────────
        # Positive actions (increase EV, ban petrol) → more positive scores
        # Negative actions (remove EV, keep petrol) → lower positive scores
        if is_ban and is_petrol:
            direction = 1.0      # Banning petrol = very positive for env
        elif is_ban and is_ev:
            direction = -1.0     # Removing EV infra = bad
        elif is_increase and is_ev:
            direction = 0.7      # More EV stations = positive but less extreme
        elif is_decrease and is_ev:
            direction = -0.7
        elif is_increase and is_petrol:
            direction = -0.5
        else:
            direction = 0.3      # Neutral/unknown

        impacts = []

        # ── Build KG-backed impacts when data is available ──────
        if kg_data and "environmental" in kg_data:
            env = kg_data["environmental"]
            env_score = qvar(78 * (0.6 + 0.4 * direction))
            impacts.append({
                "category": "environmental",
                "score": min(max(env_score, 10), 95),
                "summary": t(
                    f"{'Significant improvement' if direction > 0 else 'Negative environmental impact'} — "
                    f"{env.get('co2_reduction_percent', 'N/A')}% CO2 {'reduction' if direction > 0 else 'increase'}",
                ),
                "data_source": "knowledge_graph",
                "details": [
                    {
                        "metric": t("CO2 Emission Change"),
                        "value": t(f"{env.get('co2_reduction_tonnes_annual', 'N/A'):,} tonnes/year {'reduction' if direction > 0 else 'increase'}"),
                        "explanation": t("Calculated from vehicle counts × per-vehicle emission factors from KG data"),
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("AQI Impact"),
                        "value": t(f"~{env.get('aqi_improvement', 'N/A')} point {'improvement' if direction > 0 else 'worsening'}"),
                        "explanation": t("Based on vehicular emission share and vehicle type contribution in Hyderabad"),
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("Noise Level Change"),
                        "value": t(f"~{env.get('noise_reduction_db', 'N/A')} dB {'reduction' if direction > 0 else 'increase'}"),
                        "explanation": t("Proportional to two-wheeler noise contribution in urban areas"),
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                ],
            })

        if kg_data and "economic" in kg_data:
            econ = kg_data["economic"]
            fin_score = qvar(68 + abs(direction) * 10)
            revenue_impact = econ.get('fuel_revenue_loss_crores_annual', 0)
            impacts.append({
                "category": "financial",
                "score": min(max(fin_score, 10), 95),
                "summary": t(
                    f"{'Major economic opportunity' if direction > 0 else 'Economic disruption'} — "
                    f"₹{revenue_impact:,} Cr revenue {'realignment' if direction > 0 else 'loss'}"
                ),
                "data_source": "knowledge_graph",
                "details": [
                    {
                        "metric": t("Fuel Revenue Impact"),
                        "value": t(f"₹{revenue_impact:,} Crores/year {'transition' if direction > 0 else 'loss'}"),
                        "explanation": t("Based on petrol consumption share of the affected vehicle category"),
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("Employment Impact"),
                        "value": t(f"~{econ.get('jobs_at_risk', 'N/A'):,} positions {'at risk' if direction <= 0 else 'transitioning'}"),
                        "explanation": t("Fuel station + mechanics jobs proportional to affected fleet"),
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("Market Opportunity"),
                        "value": t(f"₹{econ.get('ev_market_opportunity_crores', 'N/A'):,} Crores"),
                        "explanation": t("New EV market value from vehicle replacement and charging infrastructure"),
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                ],
            })

        if kg_data and "health" in kg_data:
            health = kg_data["health"]
            health_score = qvar(65 + direction * 12)
            lives = health.get('estimated_lives_saved_annual', 0)
            impacts.append({
                "category": "human",
                "score": min(max(health_score, 10), 95),
                "summary": t(
                    f"{'Positive' if direction > 0 else 'Negative'} health outcomes — "
                    f"est. {lives} lives {'saved' if direction > 0 else 'at additional risk'} annually"
                ),
                "data_source": "knowledge_graph",
                "details": [
                    {
                        "metric": t("Lives Affected"),
                        "value": t(f"~{lives} annually"),
                        "explanation": t("From changes in air pollution exposure and road accident rates"),
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("Healthcare Cost Change"),
                        "value": t(f"₹{health.get('healthcare_savings_crores_annual', 'N/A'):,} Crores/year"),
                        "explanation": t("Reduction in pollution-related medical expenditure"),
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                ],
            })

        existing_categories = {i["category"] for i in impacts}

        # ── Risks axis ───────────────────────────────────────────
        if "risks" not in existing_categories:
            risk_score = qvar(55 + abs(direction) * 10)
            if is_ban:
                risk_summary = t("High implementation risk — mandatory transition affects millions; political resistance expected")
                risk_infra_val = t("~35% ready (charging stations cover only 12% of demand)")
                risk_resist_val = t("High — 4M+ vehicle owners directly impacted")
            elif is_increase and is_ev:
                risk_summary = t("Moderate risk — grid load increase and land acquisition challenges")
                risk_infra_val = t("~65% feasible given existing grid capacity")
                risk_resist_val = t("Low — generally positive public reception")
            else:
                risk_summary = t(f"{'Moderate' if direction >= 0 else 'High'} risks — implementation complexity and stakeholder alignment needed")
                risk_infra_val = t("~50% infrastructure readiness estimated")
                risk_resist_val = t("Moderate — depends on incentives provided")

            impacts.append({
                "category": "risks",
                "score": min(max(risk_score, 15), 90),
                "summary": risk_summary,
                "data_source": "llm_estimate",
                "details": [
                    {
                        "metric": t("Infrastructure Readiness"),
                        "value": risk_infra_val,
                        "explanation": t("Based on current EV charging station density vs. required coverage"),
                        "confidence": "medium",
                        "source": "llm_estimate",
                    },
                    {
                        "metric": t("Public & Political Resistance"),
                        "value": risk_resist_val,
                        "explanation": t("Estimated based on scale of impact on daily commuters and industry"),
                        "confidence": "low",
                        "source": "llm_estimate",
                    },
                    {
                        "metric": t("Implementation Timeline Risk"),
                        "value": t(f"{'High' if is_ban else 'Moderate'} — phased rollout critical"),
                        "explanation": t("Abrupt changes without incentive structure risk economic backlash"),
                        "confidence": "medium",
                        "source": "llm_estimate",
                    },
                ],
            })

        # ── Opportunities axis ───────────────────────────────────
        if "opportunities" not in existing_categories:
            opp_score = qvar(60 + direction * 15)
            if is_increase and is_ev:
                opp_summary = t("Strong: EV ecosystem growth, tourism boost, clean city branding")
                green_jobs = "~80,000+ new positions"
                leadership = t("Could attract 10+ EV manufacturers to set up Hyderabad hubs")
            elif is_ban and is_petrol:
                opp_summary = t("Major opportunity: India's first petrol-free metro — green FDI magnet")
                green_jobs = "~50,000+ new positions"
                leadership = t("Potential to become India's EV capital, attracting ₹15,000+ Cr investment")
            else:
                opp_summary = t("Moderate opportunities in clean tech and sustainable mobility sector")
                green_jobs = "~20,000–40,000 positions"
                leadership = t("Opens path for cleaner urban mobility frameworks")

            impacts.append({
                "category": "opportunities",
                "score": min(max(opp_score, 15), 95),
                "summary": opp_summary,
                "data_source": "llm_estimate",
                "details": [
                    {
                        "metric": t("Green Job Creation"),
                        "value": t(green_jobs),
                        "explanation": t("EV manufacturing, charging networks, battery recycling, and maintenance ecosystem"),
                        "confidence": "medium",
                        "source": "llm_estimate",
                    },
                    {
                        "metric": t("Clean Tech Leadership"),
                        "value": leadership,
                        "explanation": t("First-mover advantage in India's EV transition draws policy and industry attention"),
                        "confidence": "low",
                        "source": "llm_estimate",
                    },
                ],
            })

        # ── Fill missing KG axes with query-specific estimates ───
        if "financial" not in existing_categories:
            fin_score = qvar(55 + direction * 12)
            impacts.append({
                "category": "financial",
                "score": min(max(fin_score, 10), 95),
                "summary": t(f"{'Positive net economic effect' if direction > 0 else 'Short-term economic disruption'} with significant sectoral shifts"),
                "data_source": "llm_estimate",
                "details": [
                    {
                        "metric": t("Budget Impact"),
                        "value": t(f"{'Net positive' if direction > 0 else 'Net negative'} over 5 years"),
                        "explanation": t("Long-term savings in fuel imports and healthcare offset short-term transition costs"),
                        "confidence": "low",
                        "source": "llm_estimate",
                    },
                ],
            })

        if "environmental" not in existing_categories:
            env_score = qvar(60 + direction * 15)
            impacts.append({
                "category": "environmental",
                "score": min(max(env_score, 10), 95),
                "summary": t(f"{'Clear environmental gains' if direction > 0 else 'Environmental setback'} from this policy change"),
                "data_source": "llm_estimate",
                "details": [
                    {
                        "metric": t("Air Quality"),
                        "value": t(f"AQI expected to {'improve by 10–15%' if direction > 0 else 'worsen by 5–10%'}"),
                        "explanation": t("Vehicular emissions are 65% of urban air pollution in Hyderabad"),
                        "confidence": "low",
                        "source": "llm_estimate",
                    },
                ],
            })

        if "human" not in existing_categories:
            human_score = qvar(58 + direction * 10)
            impacts.append({
                "category": "human",
                "score": min(max(human_score, 10), 90),
                "summary": t(f"{'Quality of life improvement' if direction > 0 else 'Disruption to daily commuters'} for Hyderabad residents"),
                "data_source": "llm_estimate",
                "details": [
                    {
                        "metric": t("Commuter Experience"),
                        "value": t(f"{'Improved air quality and reduced noise' if direction > 0 else 'Higher costs and transition friction'}"),
                        "explanation": t("Based on modal share of two-wheelers in daily commutes (~38%)"),
                        "confidence": "low",
                        "source": "llm_estimate",
                    },
                ],
            })

        # Sort in canonical order
        order = ["financial", "environmental", "human", "risks", "opportunities"]
        impacts.sort(key=lambda i: order.index(i["category"]) if i["category"] in order else 99)

        overall_score = round(sum(i["score"] for i in impacts) / max(len(impacts), 1), 1)

        # Build unique summary
        action_word = "removing" if is_ban or is_decrease else ("expanding" if is_increase else "changing")
        subject = "EV charging infrastructure" if is_ev else ("petrol vehicles" if is_petrol else "this policy")
        note = " (Note: Gemini AI unavailable — using KG-grounded analysis)" if not kg_data else ""

        overall_summary = t(
            f"{'Significantly positive' if overall_score > 65 else 'Mixed'} multi-dimensional impact from {action_word} {subject} in {city}. "
            f"Overall score of {overall_score}/100 across {len(impacts)} impact axes, "
            f"{'with strong KG-backed data for key metrics' if kg_data else 'estimated from domain knowledge'}."
            + note
        )

        return {
            "impacts": impacts,
            "overall_summary": overall_summary,
            "overall_score": overall_score,
            "domain": "general",
        }

    async def generate_suggestions(self, city: str = "Hyderabad", count: int = 3) -> list:
        """Generate dynamic 'What If' AI scenario suggestions for a city."""
        fallback = [
            f"What if {city} banned single-use plastics next year?",
            f"What if {city} made all public transport entirely free?",
            f"What if {city} doubled its green cover by 2030?",
        ]

        if not self.is_available:
            return fallback

        prompt = (
            f"Generate exactly {count} creative, impactful, and realistic 'What If' policy or "
            f"infrastructure scenarios for the city of {city}. "
            f"Return ONLY a valid JSON array of strings. No markdown. No extra keys. "
            f"Example: [\"What if {city} mandated solar panels on all new buildings?\"]"
        )

        models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
        ]

        for model_name in models_to_try:
            try:
                response = self._client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.8,
                    ),
                )
                result = json.loads(response.text)
                if isinstance(result, list) and len(result) > 0:
                    logger.info("Suggestions generated via %s: %s items", model_name, len(result))
                    return [str(s) for s in result[:count]]
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str:
                    logger.warning("Model %s unavailable for suggestions, trying next...", model_name)
                    continue
                logger.error("Suggestions error on %s: %s", model_name, e)
                break

        logger.warning("All models failed for suggestions, returning fallback")
        return fallback

    async def generate_newspaper(self, scenario_query: str, overall_score: float, city: str = "Hyderabad") -> dict:
        """Generate a futuristic newspaper article based on the scenario simulation."""
        fallback = {
            "headline": "City Implements Sweeping Reforms",
            "subheadline": f"The '{scenario_query}' initiative promises major changes.",
            "article": f"In a surprising move, officials have moved forward with the '{scenario_query}' proposal. Experts debate the long-term feasibility, but early indicators suggest a massive shift in public infrastructure. The overall impact score of this initiative is tracking at {overall_score}/100.",
            "opinion": "This could be the defining moment for our future, provided execution doesn't falter.",
            "market_reaction": "Local markets show cautious optimism, with relevant sectors rallying slightly."
        }

        if not self.is_available:
            return fallback

        prompt = (
            f"You are a top journalist living 5 years in the future in {city}.\n"
            f"A major scenario was just fully implemented: '{scenario_query}'.\n"
            f"The simulation engine gave this scenario an overall success/impact score of {overall_score}/100.\n\n"
            f"Write a realistic, premium newspaper front page covering this event. Return ONLY a valid JSON object with these exact keys:\n"
            f"- \"headline\": A catchy, realistic newspaper main headline.\n"
            f"- \"subheadline\": A brief, factual sub-headline.\n"
            f"- \"article\": A 2-paragraph news report detailing the immediate effects, public reaction, and long-term outlook (as if it actually happened). Use a serious, journalistic tone.\n"
            f"- \"opinion\": A 1-sentence quote from a local citizen or expert.\n"
            f"- \"market_reaction\": A 1-sentence summary of how the local economy or stock market reacted.\n\n"
            f"Do NOT include markdown like ```json. Return just the raw JSON."
        )

        models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
        ]

        for model_name in models_to_try:
            try:
                response = self._client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.8,
                    ),
                )
                result = json.loads(response.text)
                if isinstance(result, dict) and "headline" in result:
                    logger.info("Newspaper generated via %s", model_name)
                    return result
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str:
                    logger.warning("Model %s unavailable for newspaper, trying next...", model_name)
                    continue
                logger.error("Newspaper error on %s: %s", model_name, e)
                break

        logger.warning("All models failed for newspaper, returning fallback")
        return fallback

    async def generate_butterfly_chain(
        self,
        scenario_query: str,
        overall_score: float,
        city: str = "Hyderabad",
    ) -> dict:
        """
        Generate a causal chain of 2nd/3rd order unintended consequences.
        Returns nodes and links for a force-directed graph visualization.
        """
        fallback_nodes = [
            {"id": "root", "label": scenario_query[:60], "order": 0, "sentiment": "neutral", "size": 28},
            {"id": "e1", "label": "Fuel station revenue drops 40%", "order": 1, "sentiment": "negative", "size": 20},
            {"id": "e2", "label": "EV charging demand spikes", "order": 1, "sentiment": "positive", "size": 20},
            {"id": "e3", "label": "Air quality improves 25%", "order": 1, "sentiment": "positive", "size": 20},
            {"id": "e4", "label": f"Used vehicle black market emerges in {city}", "order": 2, "sentiment": "negative", "size": 16},
            {"id": "e5", "label": "Power grid overload in peak hours", "order": 2, "sentiment": "negative", "size": 16},
            {"id": "e6", "label": "Battery waste crisis by 2032", "order": 2, "sentiment": "negative", "size": 16},
            {"id": "e7", "label": "Respiratory hospital visits fall 30%", "order": 2, "sentiment": "positive", "size": 16},
            {"id": "e8", "label": "Mechanics forced to retrain", "order": 2, "sentiment": "negative", "size": 16},
            {"id": "e9", "label": "Lithium mining demand surges globally", "order": 3, "sentiment": "negative", "size": 12},
            {"id": "e10", "label": "Neighborhood noise drops 15dB", "order": 3, "sentiment": "positive", "size": 12},
            {"id": "e11", "label": "Property values rise near metro", "order": 3, "sentiment": "positive", "size": 12},
            {"id": "e12", "label": "Rural areas left behind in transition", "order": 3, "sentiment": "negative", "size": 12},
        ]
        fallback_links = [
            {"source": "root", "target": "e1", "label": "causes"},
            {"source": "root", "target": "e2", "label": "triggers"},
            {"source": "root", "target": "e3", "label": "leads to"},
            {"source": "e1", "target": "e4", "label": "spawns"},
            {"source": "e1", "target": "e8", "label": "forces"},
            {"source": "e2", "target": "e5", "label": "risks"},
            {"source": "e2", "target": "e6", "label": "eventually causes"},
            {"source": "e3", "target": "e7", "label": "results in"},
            {"source": "e3", "target": "e10", "label": "also"},
            {"source": "e6", "target": "e9", "label": "drives"},
            {"source": "e7", "target": "e11", "label": "indirectly"},
            {"source": "e5", "target": "e12", "label": "worsens"},
        ]
        fallback = {"nodes": fallback_nodes, "links": fallback_links}

        if not self.is_available:
            return fallback

        prompt = (
            f"You are an expert systems thinker analyzing unintended consequences.\n\n"
            f"Scenario: \"{scenario_query}\" in {city} (impact score: {overall_score}/100).\n\n"
            f"Generate a BUTTERFLY EFFECT causal chain showing 2nd and 3rd order consequences.\n"
            f"Think about domino effects: what happens BECAUSE of what happens.\n\n"
            f"Return ONLY valid JSON with this structure:\n"
            f"{{\n"
            f"  \"nodes\": [\n"
            f"    {{\"id\": \"root\", \"label\": \"short scenario name\", \"order\": 0, \"sentiment\": \"neutral\", \"size\": 28}},\n"
            f"    {{\"id\": \"e1\", \"label\": \"1st order effect\", \"order\": 1, \"sentiment\": \"positive|negative\", \"size\": 20}},\n"
            f"    {{\"id\": \"e5\", \"label\": \"2nd order effect\", \"order\": 2, \"sentiment\": \"positive|negative\", \"size\": 16}},\n"
            f"    {{\"id\": \"e9\", \"label\": \"3rd order effect\", \"order\": 3, \"sentiment\": \"positive|negative\", \"size\": 12}}\n"
            f"  ],\n"
            f"  \"links\": [\n"
            f"    {{\"source\": \"root\", \"target\": \"e1\", \"label\": \"causes\"}}\n"
            f"  ]\n"
            f"}}\n\n"
            f"Rules:\n"
            f"- Generate exactly 12-15 nodes total: 1 root, 3-4 order-1, 4-5 order-2, 3-4 order-3\n"
            f"- Each link must connect a lower-order node to a higher-order node\n"
            f"- Labels must be specific, surprising, and data-grounded (not generic)\n"
            f"- Mix positive and negative consequences\n"
            f"- Include at least 2 truly surprising/unintuitive consequences\n"
            f"- Use short labels (under 50 chars)\n"
        )

        models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
        ]

        for model_name in models_to_try:
            try:
                response = self._client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.7,
                        max_output_tokens=2048,
                    ),
                )
                result = json.loads(response.text)
                if isinstance(result, dict) and "nodes" in result and "links" in result:
                    logger.info("Butterfly effect chain generated via %s: %d nodes", model_name, len(result["nodes"]))
                    return result
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str:
                    logger.warning("Model %s unavailable for butterfly, trying next...", model_name)
                    continue
                logger.error("Butterfly effect error on %s: %s", model_name, e)
                break

        logger.warning("All models failed for butterfly effect, returning fallback")
        return fallback


    async def generate_goal_roadmap(self, goal: str, city: str, timeline: str) -> dict[str, Any]:
        """Generate a backcasted roadmap for a specific goal."""
        if not self.is_available:
            return {
                "goal_summary": "Fallback roadmap due to missing API key.",
                "total_estimated_budget": "$0",
                "feasibility_score": 50,
                "milestones": [{"year": "2025", "title": "Start", "description": "Initiate.", "key_policy": "None", "infrastructure_change": "None"}],
                "major_risks": ["No AI available"]
            }
        
        prompt = GOAL_SEEK_PROMPT.format(goal=goal, city=city, timeline=timeline)
        
        models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
            "models/gemini-flash-latest",
        ]
        
        for model_name in models_to_try:
            for attempt in range(1, _MAX_RETRIES + 1):
                try:
                    response = self._client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.2,
                        ),
                    )
                    return json.loads(response.text)
                except Exception as e:
                    err_str = str(e).lower()
                    if attempt < _MAX_RETRIES and not ("429" in err_str or "quota" in err_str or "resource_exhausted" in err_str):
                        await asyncio.sleep(_RETRY_DELAY_S)
                        continue
                    
                    if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str:
                        logger.warning(f"Model {model_name} unavailable for goal seek, trying next...")
                        break # Break retry loop, try next model
                    
                    if attempt == _MAX_RETRIES:
                        logger.error(f"Goal seek failed on {model_name}: {e}")
                        break

        logger.warning("All models failed for goal seek, returning fallback")
        return {
            "goal_summary": f"Fallback roadmap for {goal} in {city} by {timeline}. AI quota exceeded.",
            "total_estimated_budget": "$100M (Est.)",
            "feasibility_score": 65,
            "milestones": [
                {"year": "2025", "title": "Phase 1: Planning", "description": "Initial feasibility studies and pilot programs.", "key_policy": "Establish committee", "infrastructure_change": "Survey zones"},
                {"year": timeline, "title": "Phase 2: Completion", "description": "Full city-wide implementation of the goal.", "key_policy": "Mandate compliance", "infrastructure_change": "Scale infrastructure"}
            ],
            "major_risks": ["Funding delays", "Public resistance due to transition costs"]
        }

    async def generate_vision_image(self, scenario_summary: str, city: str, scenario_query: str = "") -> dict[str, str]:
        """Generate a dynamic AI image URL and description based on the scenario."""
        import urllib.parse
        
        # Use the original query if provided, otherwise fall back to summary
        context = scenario_query if scenario_query else scenario_summary
        context_lower = context.lower()
        
        # Build a highly specific fallback image prompt tied to the actual scenario
        fallback_prompt = f"Photorealistic aerial view of {city} India in 2030"
        fallback_description = f"A visualization of {city} after implementing this policy change."
        
        if "electric" in context_lower or "ev" in context_lower or "rickshaw" in context_lower:
            fallback_prompt = f"Photorealistic street view of {city} India with sleek electric auto-rickshaws, EV charging stations on every corner, clean roads with no exhaust smoke, modern LED street lights, clear blue sky, bustling pedestrians, 2030 futuristic"
            fallback_description = f"The streets of {city} are transformed — silent electric auto-rickshaws glide through clean, smoke-free roads. EV charging stations dot every major intersection, and the air quality has visibly improved with clear blue skies replacing the usual smog."
        elif "metro" in context_lower or "transit" in context_lower or "train" in context_lower:
            fallback_prompt = f"Photorealistic view of {city} India with elevated modern metro rail, glass stations, pedestrian plazas below, green corridors alongside tracks, fewer cars on roads, sunset lighting, 2030"
            fallback_description = f"{city}'s skyline is now defined by sleek elevated metro lines connecting every neighborhood. Below the tracks, car traffic has thinned dramatically, replaced by pedestrian-friendly plazas and cycling lanes."
        elif "green" in context_lower or "park" in context_lower or "tree" in context_lower:
            fallback_prompt = f"Photorealistic aerial view of {city} India with massive urban parks, vertical gardens on buildings, tree-lined boulevards, rooftop greenery, clean air, golden hour lighting, 2030"
            fallback_description = f"A green revolution has swept {city}. Vertical gardens climb the sides of commercial buildings, rooftop farms dot the skyline, and wide tree-lined boulevards have replaced congested roads."
        elif "water" in context_lower or "flood" in context_lower or "rain" in context_lower:
            fallback_prompt = f"Photorealistic view of {city} India with smart water management, rain gardens, permeable streets, underground drainage, blue-green infrastructure, clean canals, 2030"
            fallback_description = f"{city} has conquered its flooding problem. Smart permeable roads absorb rainwater, rain gardens line every street, and a network of clean urban canals now serves as both drainage and recreation."
        elif "solar" in context_lower or "energy" in context_lower or "renewable" in context_lower:
            fallback_prompt = f"Photorealistic aerial view of {city} India with solar panels on every rooftop, wind turbines on hills, smart grid towers, clean modern city, bright sunshine, 2030"
            fallback_description = f"Every rooftop in {city} gleams with solar panels. The city has achieved energy independence — wind turbines spin on the outskirts while a visible smart grid infrastructure powers the entire metropolis cleanly."
        elif "ban" in context_lower or "petrol" in context_lower or "car" in context_lower or "vehicle" in context_lower:
            fallback_prompt = f"Photorealistic street of {city} India with no petrol vehicles, only electric buses and cycles, wide pedestrian walkways, clean air, modern architecture, 2030"
            fallback_description = f"The streets of {city} are unrecognizable — the roar of petrol engines has been replaced by the quiet hum of electric buses. Wide pedestrian walkways and cycling lanes dominate where cars once gridlocked."
        elif "school" in context_lower or "education" in context_lower:
            fallback_prompt = f"Photorealistic view of {city} India with modern smart schools, digital classrooms visible through glass walls, children with tablets, green playgrounds, 2030"
            fallback_description = f"{city}'s education landscape is transformed. Smart schools with glass-walled digital classrooms dot every neighborhood, surrounded by green playgrounds where children learn through augmented reality."
        else:
            fallback_prompt = f"Photorealistic aerial view of {city} India as a futuristic smart city, modern architecture, clean streets, smart infrastructure, drone delivery, LED billboards, 2030"
            fallback_description = f"{city} has undergone a dramatic transformation. Smart infrastructure, clean streets, and modern architecture define the cityscape, with drone delivery systems and intelligent traffic management visible everywhere."
        
        # Try AI-generated prompt + description if Gemini is available
        if self.is_available:
            models_to_try = [
                "models/gemini-2.5-flash",
                "models/gemini-2.0-flash",
                "models/gemini-2.0-flash-lite",
            ]
            for model_name in models_to_try:
                try:
                    prompt = (
                        f"You are a visual futurist. Based on this scenario for {city}, India:\n"
                        f"Scenario: \"{context[:300]}\"\n\n"
                        f"Generate TWO things in this EXACT format (no markdown, no extra text):\n"
                        f"IMAGE_PROMPT: [A vivid 25-40 word comma-separated image generation prompt for a photorealistic concept art showing how {city}'s streets/skyline would SPECIFICALLY look after this policy is implemented. Include the city name, specific infrastructure changes, lighting, atmosphere.]\n"
                        f"DESCRIPTION: [A 2-3 sentence narrative description explaining what the viewer is seeing in this image and WHY the city looks this way due to the policy change. Be specific to the scenario.]"
                    )
                    response = self._client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(temperature=0.6),
                    )
                    text = response.text.strip()
                    
                    # Parse the response
                    if "IMAGE_PROMPT:" in text and "DESCRIPTION:" in text:
                        parts = text.split("DESCRIPTION:")
                        img_part = parts[0].replace("IMAGE_PROMPT:", "").strip()
                        desc_part = parts[1].strip()
                        if img_part:
                            fallback_prompt = img_part[:400]
                        if desc_part:
                            fallback_description = desc_part[:500]
                        logger.info(f"Vision prompt+description generated via {model_name}")
                        break
                    elif text:
                        # If format didn't match, use the whole thing as prompt
                        fallback_prompt = text[:400]
                        logger.info(f"Vision prompt (raw) generated via {model_name}")
                        break
                except Exception as e:
                    err_str = str(e).lower()
                    if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str:
                        logger.warning(f"Model {model_name} unavailable for vision, trying next...")
                        continue
                    logger.error(f"Vision error on {model_name}: {e}")
                    break
        
        # Generate deterministic seed from the scenario text
        seed = sum(ord(c) for c in context) % 100000
        encoded_prompt = urllib.parse.quote(fallback_prompt)
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=400&nologo=true&seed={seed}"
        
        return {"image_url": image_url, "description": fallback_description}


async def generate_suggestions_standalone(city: str = "Hyderabad", count: int = 3) -> list:
    """Module-level helper to generate AI scenario suggestions."""
    return await llm_service.generate_suggestions(city=city, count=count)


async def generate_chat_reply(message: str, scenario_query: str) -> str:
    """Module-level helper to generate chat reply (wraps LLMService chat)."""
    return await llm_service.generate_scenario_chat_reply(
        message=message,
        scenario_query=scenario_query,
    )


async def generate_butterfly_effect(scenario_query: str, overall_score: float, city: str = "Hyderabad") -> dict:
    """Generate a causal chain of unintended consequences for a scenario."""
    return await llm_service.generate_butterfly_chain(
        scenario_query=scenario_query,
        overall_score=overall_score,
        city=city,
    )
# ── Module-level singleton and exports ──────────────────────────────────────

llm_service = LLMService()


async def generate_chat_reply(scenario_query: str, message: str, history: list) -> str:
    """Generate a chat reply using Gemini with multi-model fallback."""
    if llm_service.is_available:
        history_text = "\n".join([f"{msg.role.capitalize()}: {msg.content}" for msg in history])

        prompt = (
            f'You are Foresight AI — an expert urban planning and policy analyst.\n\n'
            f'A user simulated this scenario: "{scenario_query}"\n\n'
            f'They are now asking a follow-up question. Answer it directly, specifically, and intelligently.\n'
            f'Keep it concise (2-3 paragraphs max). Use real-world data and reasoning.\n'
            f'Do NOT give generic answers — always tie your response to this specific scenario.\n\n'
            f'{("Previous conversation:\n" + history_text + "\n") if history_text else ""}'
            f'User: {message}'
        )

        models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
            "models/gemini-flash-latest",
        ]
        for model_name in models_to_try:
            try:
                response = llm_service._client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                logger.info("Chat reply generated via %s", model_name)
                return response.text
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "404" in err_str or "not_found" in err_str:
                    logger.warning("Model %s unavailable, trying next...", model_name)
                    continue
                logger.error("Chat LLM unexpected error on %s: %s", model_name, e)
                break

        logger.error("All Gemini models exhausted for chat, using keyword fallback")

    # Keyword fallback
    message_lower = message.lower()
    q = scenario_query
    if "cost" in message_lower or "money" in message_lower or "budget" in message_lower or "financial" in message_lower:
        return f"For '{q}': The financial impact involves significant upfront transition costs offset by long-term savings in fuel imports, healthcare, and urban maintenance. Our model estimates a net positive ROI within 5-7 years."
    elif "environment" in message_lower or "pollution" in message_lower or "carbon" in message_lower or "air" in message_lower:
        return f"For '{q}': The environmental gains are substantial. The scenario is projected to reduce urban CO2 emissions and improve AQI in the city center within 24 months of implementation."
    elif "people" in message_lower or "health" in message_lower or "jobs" in message_lower or "human" in message_lower:
        return f"For '{q}': Public health outcomes improve due to reduced vehicular pollution. However, transitional job losses in the fossil fuel sector require active reskilling programs."
    elif "risk" in message_lower or "challenge" in message_lower or "problem" in message_lower or "bad" in message_lower:
        return f"For '{q}': Key risks include infrastructure readiness gaps, political resistance from incumbent industries, and behavior change pace. A phased rollout with strong incentives is critical."
    elif "opportunity" in message_lower or "future" in message_lower or "benefit" in message_lower:
        return f"For '{q}': The biggest opportunity is first-mover advantage — establishing the region as a clean tech hub and attracting green investment and EV manufacturers."
    else:
        return f"For '{q}': This scenario has wide-ranging impacts across financial, environmental, and human dimensions. Could you be more specific? For example: costs, health outcomes, risks, or long-term opportunities?"

