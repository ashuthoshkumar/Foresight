"""Scenario simulation API endpoints."""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends

from app.models.scenario import (
    ErrorResponse,
    HistoryResponse,
    ScenarioRequest,
    SimulationResponse,
    ChatRequest,
    ChatResponse,
)
from app.services.simulation import simulation_engine
from app.services.llm_service import generate_chat_reply, llm_service
from app.api.v1.middleware import get_optional_user

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

@router.post(
    "/simulate",
    response_model=SimulationResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def simulate_scenario(
    request: ScenarioRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Simulate a "What If" scenario.

    Accepts a natural language description and returns a multi-dimensional
    impact analysis across financial, environmental, human, risk, and
    opportunity axes.
    """
    try:
        parameters = request.parameters or {}
        if current_user:
            parameters["user_email"] = current_user["email"]
            
        result = await simulation_engine.simulate(
            query=request.query,
            parameters=parameters,
            language=request.language,
        )
        return SimulationResponse(result=result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {str(e)}",
        )


@router.get(
    "/suggestions"
)
async def get_suggestions(city: str = "Hyderabad"):
    """
    Get dynamic AI-generated 'What If' scenarios for a city.
    """
    try:
        suggestions = await llm_service.generate_suggestions(city=city)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/leaderboard"
)
async def get_leaderboard():
    """
    Get top simulated/voted scenarios across the community.
    Returns mock data for the demo.
    """
    return {
        "leaderboard": [
            {
                "id": "scenario-lb-1",
                "query": "What if Hyderabad banned petrol two-wheelers by 2030?",
                "domain": "Urban Mobility",
                "score": 85.0,
                "popularity_count": 14230
            },
            {
                "id": "scenario-lb-2",
                "query": "What if TS-iPASS subsidies for IT companies are doubled?",
                "domain": "Economic Policy",
                "score": 78.5,
                "popularity_count": 8945
            },
            {
                "id": "scenario-lb-3",
                "query": "What if Hussain Sagar lake area becomes a strictly pedestrian-only zone?",
                "domain": "Urban Environment",
                "score": 92.0,
                "popularity_count": 6512
            },
            {
                "id": "scenario-lb-4",
                "query": "What if all new residential buildings mandate solar roofing?",
                "domain": "Energy & Real Estate",
                "score": 88.5,
                "popularity_count": 5231
            },
            {
                "id": "scenario-lb-5",
                "query": "What if the ORR toll rates are dynamically priced based on congestion?",
                "domain": "Transport Infrastructure",
                "score": 71.0,
                "popularity_count": 4120
            }
        ]
    }


@router.get(
    "/history",
    response_model=HistoryResponse,
)
async def get_history(limit: int = 50):
    """Get past simulation scenarios, most recent first."""
    scenarios = simulation_engine.get_history(limit=limit)
    return HistoryResponse(scenarios=scenarios, total=len(scenarios))


@router.get(
    "/{scenario_id}",
    response_model=SimulationResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_scenario(scenario_id: str):
    """Retrieve a specific scenario by ID."""
    result = simulation_engine.get_scenario(scenario_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return SimulationResponse(result=result)

@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def chat_scenario(request: ChatRequest):
    """Chat with the AI about a specific scenario."""
    try:
        reply = await generate_chat_reply(
            scenario_query=request.scenario_query,
            message=request.message,
            history=request.history,
        )
        return ChatResponse(success=True, reply=reply)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}",
        )
