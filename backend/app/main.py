from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from app.config import settings
from app.utils.logging import setup_logging
from app.models.base import init_db
from app.routers import health_router, issues_router, metrics_router

from contextlib import asynccontextmanager

# Setup application logging
setup_logging()
logger = logging.getLogger(__name__)

# Lifespan event handler replacing deprecated @app.on_event("startup")
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    try:
        init_db()
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.critical(f"Database initialization failed: {e}")
        raise e
    logger.info(f"Polis Backend started. Environment: {settings.ENV}")
    yield
    logger.info("Polis Backend shutting down...")

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Industry-level backend API for the Polis civic operations platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS Middleware
# Essential for allowing the React frontend to consume the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to log API request timing (useful for latency diagnostics in AWS CloudWatch)
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log request path, method and processing latency
    logger.info(
        f"API Request: {request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Latency: {process_time:.4f}s"
    )
    return response

# Global Exception Handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error for {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact the administrator."}
    )

# Include API Routers
app.include_router(health_router)
app.include_router(issues_router)
app.include_router(metrics_router)

# Basic welcome endpoint
@app.get("/")
def read_root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME}!",
        "documentation": "/docs",
        "health": "/health"
    }
