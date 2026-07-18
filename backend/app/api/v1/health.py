"""Health check endpoint."""

from fastapi import APIRouter

from app.services.knowledge_graph import knowledge_graph
from app.services.llm_service import llm_service

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Application health check."""
    kg_stats = knowledge_graph.get_stats()
    return {
        "status": "healthy",
        "services": {
            "knowledge_graph": {
                "initialized": knowledge_graph._initialized,
                "nodes": kg_stats["nodes"],
                "edges": kg_stats["edges"],
                "domains": kg_stats["domains"],
            },
            "llm": {
                "available": llm_service.is_available,
                "provider": "gemini" if llm_service.is_available else "fallback",
            },
        },
    }
