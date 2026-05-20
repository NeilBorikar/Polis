from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
from app.api.deps import get_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check() -> dict:
    """
    Basic health check for container liveness probe (e.g. AWS App Runner, ECS).
    Returns immediately to confirm the web server is running.
    """
    return {"status": "healthy"}

@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)) -> dict:
    """
    Readiness check to verify that all dependencies (like database) are reachable.
    AWS Target Groups / ALB can use this to route traffic safely.
    """
    try:
        # Run a simple ping-style query to verify DB connection
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Readiness check failed: Database connection issues: {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
