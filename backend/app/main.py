"""
Foresight — AI "What If" Decision Engine

FastAPI application factory with startup initialization.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.config import get_settings
from app.services.knowledge_graph import knowledge_graph
from app.services.llm_service import llm_service
from app.services.database import db_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle — initialize services on startup."""
    settings = get_settings()
    logger.info("🚀 Starting Foresight v%s", settings.app_version)

    # Initialize Database
    await db_service.initialize()
    logger.info("💾 Database initialized")

    # Initialize Knowledge Graph
    knowledge_graph.initialize()
    stats = knowledge_graph.get_stats()
    logger.info(
        "📊 Knowledge Graph: %d nodes, %d edges, %d domains",
        stats["nodes"], stats["edges"], stats["domains"],
    )

    # Initialize LLM Service
    llm_service.initialize()
    if llm_service.is_available:
        logger.info("🤖 Gemini LLM service ready")
    else:
        logger.warning("⚠️  Gemini API key not set — using fallback analysis")

    logger.info("✅ Foresight is ready!")

    yield

    logger.info("👋 Shutting down Foresight")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Foresight — AI Decision Engine",
        description=(
            "An AI-powered platform that simulates the multi-faceted consequences "
            "of hypothetical scenarios, providing predictive insights across financial, "
            "environmental, human, risk, and opportunity dimensions."
        ),
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API router
    app.include_router(v1_router)

    return app


# Application instance
app = create_app()
