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
            return self._fallback_analysis(query, kg_data, language)

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
    ) -> dict[str, Any]:
        """Generate a basic analysis from KG data without LLM."""
        impacts = []
        
        # Super basic translation for the hardcoded fallback
        is_hi = language.lower() == 'hi'
        is_te = language.lower() == 'te'
        
        def t(en: str, hi: str, te: str) -> str:
            if is_hi: return hi
            if is_te: return te
            return en
        if kg_data and "environmental" in kg_data:
            env = kg_data["environmental"]
            impacts.append({
                "category": "environmental",
                "score": 78,
                "summary": t(f"Significant environmental improvement with {env.get('co2_reduction_percent', 'N/A')}% CO2 reduction", f"{env.get('co2_reduction_percent', 'N/A')}% CO2 कटौती के साथ महत्वपूर्ण पर्यावरणीय सुधार", f"{env.get('co2_reduction_percent', 'N/A')}% CO2 తగ్గింపుతో గణనీయమైన పర్యావరణ మెరుగుదల"),
                "data_source": "knowledge_graph",
                "details": [
                    {
                        "metric": t("CO2 Emission Reduction", "CO2 उत्सर्जन में कमी", "CO2 ఉద్గారాల తగ్గింపు"),
                        "value": t(f"{env.get('co2_reduction_tonnes_annual', 'N/A'):,} tonnes/year", f"{env.get('co2_reduction_tonnes_annual', 'N/A'):,} टन/वर्ष", f"{env.get('co2_reduction_tonnes_annual', 'N/A'):,} టన్నులు/సంవత్సరం"),
                        "explanation": t("Calculated from vehicle counts × per-vehicle emission factors", "वाहन संख्या × प्रति-वाहन उत्सर्जन कारकों से गणना की गई", "వాహనాల సంఖ్య × వాహనానికి ఉద్గార కారకాల నుండి లెక్కించబడింది"),
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("AQI Improvement", "AQI सुधार", "AQI మెరుగుదల"),
                        "value": t(f"~{env.get('aqi_improvement', 'N/A')} point reduction", f"~{env.get('aqi_improvement', 'N/A')} अंक की कमी", f"~{env.get('aqi_improvement', 'N/A')} పాయింట్ తగ్గింపు"),
                        "explanation": t("Based on vehicular emission share and vehicle type contribution", "वाहनों के उत्सर्जन हिस्से और वाहन प्रकार के योगदान के आधार पर", "వాహన ఉద్గారాల వాటా మరియు వాహన రకం సహకారం ఆధారంగా"),
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("Noise Reduction", "शोर में कमी", "శబ్దం తగ్గింపు"),
                        "value": t(f"~{env.get('noise_reduction_db', 'N/A')} dB reduction", f"~{env.get('noise_reduction_db', 'N/A')} dB की कमी", f"~{env.get('noise_reduction_db', 'N/A')} dB తగ్గింపు"),
                        "explanation": t("Based on two-wheeler noise contribution share", "दोपहिया वाहन के शोर योगदान हिस्से के आधार पर", "ద్విచక్ర వాహనాల శబ్ద సహకారం వాటా ఆధారంగా"),
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
                "summary": t(f"Major economic shift with ₹{econ.get('fuel_revenue_loss_crores_annual', 'N/A'):,} Cr fuel revenue impact", f"₹{econ.get('fuel_revenue_loss_crores_annual', 'N/A'):,} करोड़ के ईंधन राजस्व प्रभाव के साथ बड़ा आर्थिक बदलाव", f"₹{econ.get('fuel_revenue_loss_crores_annual', 'N/A'):,} కోట్ల ఇంధన రాబడి ప్రభావంతో ప్రధాన ఆర్థిక మార్పు"),
                "data_source": "knowledge_graph",
                "details": [
                    {
                        "metric": t("Fuel Revenue Impact", "ईंधन राजस्व प्रभाव", "ఇంధన రాబడి ప్రభావం"),
                        "value": t(f"₹{econ.get('fuel_revenue_loss_crores_annual', 'N/A'):,} Crores/year loss", f"₹{econ.get('fuel_revenue_loss_crores_annual', 'N/A'):,} करोड़/वर्ष का नुकसान", f"₹{econ.get('fuel_revenue_loss_crores_annual', 'N/A'):,} కోట్లు/సంవత్సరం నష్టం"),
                        "explanation": t("Based on petrol consumption share of affected vehicle type", "प्रभावित वाहन प्रकार के पेट्रोल खपत हिस्से के आधार पर", "ప్రభావితమైన వాహన రకం పెట్రోల్ వినియోగ వాటా ఆధారంగా"),
                        "confidence": "high",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("Jobs At Risk", "खतरे में नौकरियाँ", "ప్రమాదంలో ఉద్యోగాలు"),
                        "value": t(f"~{econ.get('jobs_at_risk', 'N/A'):,} positions", f"~{econ.get('jobs_at_risk', 'N/A'):,} पद", f"~{econ.get('jobs_at_risk', 'N/A'):,} స్థానాలు"),
                        "explanation": t("Fuel station employees + mechanics proportional to affected vehicles", "प्रभावित वाहनों के अनुपात में ईंधन स्टेशन कर्मचारी + मैकेनिक", "ప్రభావితమైన వాహనాలకు అనులోమానుపాతంలో ఇంధన స్టేషన్ ఉద్యోగులు + మెకానిక్స్"),
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("EV Market Opportunity", "ईवी बाजार का अवसर", "EV మార్కెట్ అవకాశం"),
                        "value": t(f"₹{econ.get('ev_market_opportunity_crores', 'N/A'):,} Crores", f"₹{econ.get('ev_market_opportunity_crores', 'N/A'):,} करोड़", f"₹{econ.get('ev_market_opportunity_crores', 'N/A'):,} కోట్లు"),
                        "explanation": t("Replacement market value for transitioning vehicles", "परिवर्तित होने वाले वाहनों का प्रतिस्थापन बाजार मूल्य", "మారుతున్న వాహనాల భర్తీ మార్కెట్ విలువ"),
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
                "summary": t(f"Positive health outcomes — estimated {health.get('estimated_lives_saved_annual', 'N/A')} lives saved annually", f"सकारात्मक स्वास्थ्य परिणाम — अनुमानित {health.get('estimated_lives_saved_annual', 'N/A')} जीवन प्रति वर्ष बचेंगे", f"సానుకూల ఆరోగ్య ఫలితాలు — అంచనా వేయబడిన {health.get('estimated_lives_saved_annual', 'N/A')} ప్రాణాలు ప్రతి సంవత్సరం రక్షించబడతాయి"),
                "data_source": "knowledge_graph",
                "details": [
                    {
                        "metric": t("Lives Saved", "बचाए गए जीवन", "రక్షించబడిన ప్రాణాలు"),
                        "value": t(f"~{health.get('estimated_lives_saved_annual', 'N/A')} annually", f"प्रति वर्ष ~{health.get('estimated_lives_saved_annual', 'N/A')}", f"సంవత్సరానికి ~{health.get('estimated_lives_saved_annual', 'N/A')}"),
                        "explanation": t("From reduced air pollution and road accidents", "कम वायु प्रदूषण और सड़क दुर्घटनाओं से", "తగ్గిన వాయు కాలుష్యం మరియు రోడ్డు ప్రమాదాల నుండి"),
                        "confidence": "medium",
                        "source": "knowledge_graph",
                    },
                    {
                        "metric": t("Healthcare Cost Savings", "स्वास्थ्य देखभाल लागत बचत", "ఆరోగ్య సంరక్షణ ఖర్చు ఆదా"),
                        "value": t(f"₹{health.get('healthcare_savings_crores_annual', 'N/A'):,} Crores/year", f"₹{health.get('healthcare_savings_crores_annual', 'N/A'):,} करोड़/वर्ष", f"₹{health.get('healthcare_savings_crores_annual', 'N/A'):,} కోట్లు/సంవత్సరం"),
                        "explanation": t("Reduction in pollution-related healthcare expenditure", "प्रदूषण से संबंधित स्वास्थ्य देखभाल व्यय में कमी", "కాలుష్య సంబంధిత ఆరోగ్య సంరక్షణ వ్యయంలో తగ్గింపు"),
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
                "summary": t("Implementation risks include infrastructure gaps and economic disruption", "कार्यान्वयन जोखिमों में बुनियादी ढांचे की कमियां और आर्थिक व्यवधान शामिल हैं", "అమలు ప్రమాదాలలో మౌలిక సదుపాయాల అంతరాలు మరియు ఆర్థిక అంతరాయం ఉన్నాయి"),
                "data_source": "llm_estimate",
                "details": [
                    {
                        "metric": t("Infrastructure Readiness", "बुनियादी ढांचा तत्परता", "మౌలిక సదుపాయాల సంసిద్ధత"),
                        "value": t("~40% ready", "~40% तैयार", "~40% సిద్ధంగా ఉంది"),
                        "explanation": t("Current charging infrastructure insufficient for full transition", "वर्तमान चार्जिंग ढांचा पूर्ण परिवर्तन के लिए अपर्याप्त है", "ప్రస్తుత ఛార్జింగ్ మౌలిక సదుపాయాలు పూర్తి మార్పుకు సరిపోవు"),
                        "confidence": "medium",
                        "source": "llm_estimate",
                    },
                    {
                        "metric": t("Social Resistance", "सामाजिक प्रतिरोध", "సామాజిక ప్రతిఘటన"),
                        "value": t("High — affects millions of vehicle owners", "उच्च - लाखों वाहन मालिकों को प्रभावित करता है", "అధికం — మిలియన్ల కొద్దీ వాహన యజమానులను ప్రభావితం చేస్తుంది"),
                        "explanation": t("Mandatory transition may face public and political resistance", "अनिवार्य परिवर्तन को सार्वजनिक और राजनीतिक प्रतिरोध का सामना करना पड़ सकता है", "తప్పనిసరి మార్పు ప్రజా మరియు రాజకీయ ప్రతిఘటనను ఎదుర్కోవచ్చు"),
                        "confidence": "low",
                        "source": "llm_estimate",
                    },
                ],
            })

        if "opportunities" not in existing_categories:
            impacts.append({
                "category": "opportunities",
                "score": 82,
                "summary": t("Strong opportunities in EV manufacturing, green jobs, and clean tech leadership", "ईवी निर्माण, हरित नौकरियों और स्वच्छ तकनीक नेतृत्व में मजबूत अवसर", "EV తయారీ, గ్రీన్ జాబ్స్ మరియు క్లీన్ టెక్ నాయకత్వంలో బలమైన అవకాశాలు"),
                "data_source": "llm_estimate",
                "details": [
                    {
                        "metric": t("Green Job Creation", "हरित रोजगार सृजन", "గ్రీన్ జాబ్స్ సృష్టి"),
                        "value": t("~50,000+ new positions", "~50,000+ नए पद", "~50,000+ కొత్త స్థానాలు"),
                        "explanation": t("EV manufacturing, charging network, battery recycling ecosystem", "ईवी विनिर्माण, चार्जिंग नेटवर्क, बैटरी रीसाइक्लिंग इकोसिस्टम", "EV తయారీ, ఛార్జింగ్ నెట్‌వర్క్, బ్యాటరీ రీసైక్లింగ్ ఎకోసిస్టమ్"),
                        "confidence": "medium",
                        "source": "llm_estimate",
                    },
                    {
                        "metric": t("Clean Tech Leadership", "स्वच्छ तकनीक नेतृत्व", "క్లీన్ టెక్ నాయకత్వం"),
                        "value": t("Potential to become India's EV capital", "भारत की ईवी राजधानी बनने की क्षमता", "భారతదేశం యొక్క EV రాజధానిగా మారే అవకాశం"),
                        "explanation": t("Early adoption could attract EV manufacturers and R&D centers", "प्रारंभिक अपनाने से ईवी निर्माताओं और आरएंडडी केंद्रों को आकर्षित किया जा सकता है", "ముందస్తు స్వీకరణ EV తయారీదారులను మరియు R&D కేంద్రాలను ఆకర్షించగలదు"),
                        "confidence": "low",
                        "source": "llm_estimate",
                    },
                ],
            })

        overall_score = sum(i["score"] for i in impacts) / max(len(impacts), 1)

        return {
            "impacts": impacts,
            "overall_summary": t(
                f"This scenario would have significant multi-dimensional impacts. Analysis covers {len(impacts)} axes with a mix of data-grounded calculations and AI-estimated projections.",
                f"इस परिदृश्य के महत्वपूर्ण बहुआयामी प्रभाव होंगे। विश्लेषण में डेटा-आधारित गणनाओं और एआई-अनुमानित अनुमानों के मिश्रण के साथ {len(impacts)} कुल्हाड़ियों को शामिल किया गया है।",
                f"ఈ దృశ్యం గణనీయమైన బహుమితీయ ప్రభావాలను కలిగి ఉంటుంది. విశ్లేషణ డేటా-ఆధారిత లెక్కలు మరియు AI-అంచనాల మిశ్రమంతో {len(impacts)} అక్షాలను కవర్ చేస్తుంది."
            ),
            "overall_score": round(overall_score, 1),
            "domain": "hyderabad_ev_traffic" if kg_data else "general",
        }


# Singleton instance
llm_service = LLMService()
