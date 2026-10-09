from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, init_db
from app.services.platform import PlatformService

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db()
    
    # Bootstrap super admin if configured
    async with AsyncSessionLocal() as db:
        await PlatformService.ensure_super_admin_bootstrapped(db, settings)
        
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AyuCTMS — CRO / Sponsor Clinical Trial Management System Backend API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open in dev, restrict by config in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "ayuctms-backend",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to AyuCTMS CRO/Sponsor Backend API",
        "documentation": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_PREFIX,
    }
