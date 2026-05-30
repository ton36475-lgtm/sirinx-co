"""Future Agentic OS — FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import create_tables
from .routers import (
    health, orgs, workspaces, users, packs,
    policies, providers, budgets, tasks,
    brain, approvals, audit,
)

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup/shutdown lifecycle."""
    logger.info("Starting Future Agentic OS API...")
    if settings.APP_ENV == "development":
        await create_tables()
        logger.info("Development: tables created/verified")
    yield
    logger.info("Shutting down Future Agentic OS API...")


app = FastAPI(
    title="Future Agentic OS API",
    description="Self-Service Agentic Operating System — ระบบปฏิบัติการ AI เชิง Agentic",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )


# Routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(orgs.router, prefix="/api/v1/orgs", tags=["organizations"])
app.include_router(workspaces.router, prefix="/api/v1/workspaces", tags=["workspaces"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(packs.router, prefix="/api/v1/packs", tags=["packs"])
app.include_router(policies.router, prefix="/api/v1/policies", tags=["policies"])
app.include_router(providers.router, prefix="/api/v1/providers", tags=["providers"])
app.include_router(budgets.router, prefix="/api/v1/budgets", tags=["budgets"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(brain.router, prefix="/api/v1/brain", tags=["brain"])
app.include_router(approvals.router, prefix="/api/v1/approvals", tags=["approvals"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["audit"])


@app.get("/", tags=["root"])
async def root():
    return {
        "name": "Future Agentic OS",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }
