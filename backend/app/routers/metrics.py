from fastapi import APIRouter, Depends
from app.schemas.metrics import CityMetricsResponse
from app.repositories.metrics_repository import MetricsRepository
from app.api.deps import get_metrics_repository

router = APIRouter(prefix="/api/metrics", tags=["Metrics"])

@router.get("", response_model=CityMetricsResponse)
def get_latest_metrics(
    repo: MetricsRepository = Depends(get_metrics_repository)
) -> CityMetricsResponse:
    """
    Get the latest snapshot of city IoT and operations metrics.
    Includes Smart Buses, Streetlights, Environmental index, etc.
    """
    return repo.get_latest()
