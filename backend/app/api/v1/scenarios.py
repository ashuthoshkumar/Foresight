"""Scenario simulation API endpoints."""

from fastapi import APIRouter, HTTPException

from app.models.scenario import (
    ErrorResponse,
    HistoryResponse,
    ScenarioRequest,
    SimulationResponse,
)
from app.services.simulation import simulation_engine

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.post(
    "/simulate",
    response_model=SimulationResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def simulate_scenario(request: ScenarioRequest):
    """
    Simulate a "What If" scenario.

    Accepts a natural language description and returns a multi-dimensional
    impact analysis across financial, environmental, human, risk, and
    opportunity axes.
    """
    try:
        result = await simulation_engine.simulate(
            query=request.query,
            parameters=request.parameters,
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
