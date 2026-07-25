"""Scenario simulation API endpoints."""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.models.scenario import (
    ErrorResponse,
    ScenarioRequest,
    SimulationResponse,
    SimulationResult,
    ChatRequest,
    ChatResponse,
    NewspaperRequest,
    GoalSeekRequest,
    VisionRequest,
)
from app.services.simulation import simulation_engine
from app.services.llm_service import generate_chat_reply, llm_service
from app.services.database import db_service
from app.api.v1.middleware import get_optional_user, get_current_user

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
    opportunity axes. Now with stakeholder personas and multi-city support.
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

@router.post("/goal-seek")
async def goal_seek(request: GoalSeekRequest):
    """
    Backcast from a future goal to generate a step-by-step roadmap.
    """
    try:
        roadmap = await llm_service.generate_goal_roadmap(
            goal=request.goal,
            city=request.city,
            timeline=request.timeline
        )
        return {"roadmap": roadmap}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Goal seek failed: {str(e)}")

@router.post("/vision")
async def generate_vision(request: VisionRequest):
    """
    Generate a future vision image URL and description based on the scenario.
    """
    try:
        result = await llm_service.generate_vision_image(
            scenario_summary=request.scenario_summary,
            city=request.city,
            scenario_query=getattr(request, 'scenario_query', '') or request.scenario_summary,
        )
        return {"image_url": result["image_url"], "description": result["description"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision generation failed: {str(e)}")

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
    Get top simulated scenarios from the database, ranked by score and popularity.
    Falls back to seed data if no real data exists yet.
    """
    try:
        leaderboard = await db_service.get_leaderboard(limit=10)
        if leaderboard:
            return {"leaderboard": leaderboard}
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Leaderboard DB error: %s", e)

    # Seed data fallback
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
                "query": "What if Delhi made all public transport free?",
                "domain": "Transport Policy",
                "score": 78.5,
                "popularity_count": 8945
            },
            {
                "id": "scenario-lb-3",
                "query": "What if Bangalore doubled its metro network?",
                "domain": "Urban Infrastructure",
                "score": 92.0,
                "popularity_count": 6512
            },
            {
                "id": "scenario-lb-4",
                "query": "What if Mumbai mandated solar roofing on all new buildings?",
                "domain": "Energy & Real Estate",
                "score": 88.5,
                "popularity_count": 5231
            },
            {
                "id": "scenario-lb-5",
                "query": "What if Hyderabad made the ORR toll dynamically priced?",
                "domain": "Transport Infrastructure",
                "score": 71.0,
                "popularity_count": 4120
            }
        ]
    }


@router.get(
    "/bookmarks",
)
async def get_bookmarks(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all bookmarked scenarios for the current user."""
    try:
        bookmarks = await db_service.get_bookmarks(current_user["email"])
        return {"success": True, "scenarios": bookmarks, "total": len(bookmarks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/{scenario_id}/bookmark",
)
async def toggle_bookmark(
    scenario_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Toggle bookmark on a scenario. Returns the new bookmark state."""
    try:
        is_bookmarked = await db_service.toggle_bookmark(scenario_id, current_user["email"])
        return {"success": True, "bookmarked": is_bookmarked}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{scenario_id}/bookmark/status",
)
async def bookmark_status(
    scenario_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """Check if a scenario is bookmarked by the current user."""
    if not current_user:
        return {"bookmarked": False}
    try:
        is_bookmarked = await db_service.is_bookmarked(scenario_id, current_user["email"])
        return {"bookmarked": is_bookmarked}
    except Exception:
        return {"bookmarked": False}


@router.get(
    "/history",
)
async def get_history(
    limit: int = 50,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """Get past simulation scenarios from the database, most recent first."""
    user_email = current_user["email"] if current_user else None
    scenarios = await simulation_engine.get_history(limit=limit, user_email=user_email)
    return {"success": True, "scenarios": scenarios, "total": len(scenarios)}


@router.get(
    "/{scenario_id}",
    responses={404: {"model": ErrorResponse}},
)
async def get_scenario(scenario_id: str):
    """Retrieve a specific scenario by ID."""
    result = await simulation_engine.get_scenario(scenario_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"success": True, "result": result}

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

@router.post(
    "/newspaper",
    responses={500: {"model": ErrorResponse}},
)
async def generate_newspaper(request: NewspaperRequest):
    """Generate a futuristic newspaper article based on the scenario."""
    try:
        newspaper_data = await llm_service.generate_newspaper(
            scenario_query=request.scenario_query,
            overall_score=request.overall_score
        )
        return {"success": True, "data": newspaper_data}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate newspaper: {str(e)}",
        )


class ButterflyRequest(BaseModel):
    scenario_query: str
    overall_score: float
    city: str = "Hyderabad"


@router.post(
    "/butterfly",
    responses={500: {"model": ErrorResponse}},
)
async def generate_butterfly(request: ButterflyRequest):
    """Generate a butterfly effect causal chain for a scenario."""
    try:
        from app.services.llm_service import generate_butterfly_effect
        chain = await generate_butterfly_effect(
            scenario_query=request.scenario_query,
            overall_score=request.overall_score,
            city=request.city,
        )
        return {"success": True, "data": chain}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate butterfly effect: {str(e)}",
        )
