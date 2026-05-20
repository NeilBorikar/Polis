from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.models.base import SessionLocal
from app.repositories.issue_repository import IssueRepository
from app.repositories.metrics_repository import MetricsRepository

def get_db() -> Generator[Session, None, None]:
    """
    Dependency generator for SQLAlchemy database sessions.
    Ensures that sessions are closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_issue_repository(db: Session = Depends(get_db)) -> IssueRepository:
    """
    Dependency provider for the Issue repository.
    """
    return IssueRepository(db)

def get_metrics_repository(db: Session = Depends(get_db)) -> MetricsRepository:
    """
    Dependency provider for the CityMetrics repository.
    """
    return MetricsRepository(db)
