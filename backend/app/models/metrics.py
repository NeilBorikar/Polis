import datetime
from sqlalchemy import Column, Integer, JSON, DateTime, Float
from app.models.base import Base

class CityMetrics(Base):
    """
    Model representing snapshots of city metrics for the Polis dashboard.
    Enables tracking metric trends over time.
    """
    __tablename__ = "city_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    # Core system metrics stored as JSON to support flexible dashboard widgets
    smart_bus = Column(JSON, nullable=False)
    street_light = Column(JSON, nullable=False)
    cctv = Column(JSON, nullable=False)
    itms = Column(JSON, nullable=False)
    environment = Column(JSON, nullable=False)
    parking = Column(JSON, nullable=False)
    garbage = Column(JSON, nullable=False)
    power = Column(JSON, nullable=False)
    water = Column(JSON, nullable=False)
    stp = Column(JSON, nullable=False)

    # KPI Indices
    livability_index = Column(Float, nullable=False, default=90.0)
    drinking_water_index = Column(Float, nullable=False, default=90.0)
    revenue_index = Column(Float, nullable=False, default=90.0)

    def __repr__(self) -> str:
        return f"<CityMetrics(id={self.id}, timestamp='{self.timestamp}', livability_index={self.livability_index})>"
