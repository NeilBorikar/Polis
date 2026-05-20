from sqlalchemy.orm import Session
from app.models.metrics import CityMetrics
from app.repositories.base import BaseRepository

class MetricsRepository(BaseRepository[CityMetrics]):
    """
    Repository for CityMetrics database operations.
    Enables retrieving the latest dashboard metrics, and handles auto-seeding default data if empty.
    """
    def __init__(self, db: Session) -> None:
        super().__init__(CityMetrics, db)

    def get_latest(self) -> CityMetrics:
        """
        Retrieves the latest city metrics snapshot from the database.
        Auto-seeds default dashboard mock data if no records exist.
        """
        latest = self.db.query(self.model).order_by(self.model.timestamp.desc()).first()
        if latest:
            return latest

        # Auto-seed mock data matching frontend store.ts if database is empty
        mock_data = {
            "smart_bus": { "total": 5, "running": 2, "stopped": 3, "halt": 0, "not_polling": 0 },
            "street_light": { "total": 20, "on": 12, "off": 0, "dim1": 6, "dim2": 2 },
            "cctv": { "total": 14, "normal": 14, "faulty": 0, "no_feed": 0, "no_recording": 0 },
            "itms": { "total": 10, "working": 10, "faulty": 0 },
            "environment": { "severe": 2, "very_poor": 2, "poor": 0, "moderate": 1, "satisfactory": 1, "good": 0 },
            "parking": { "total": 5, "full": 1, "not_occupied": 1, "under25": 1, "under50": 0, "under75": 2, "over75": 1 },
            "garbage": { "total": 9, "full": 2, "empty": 0, "under25": 2, "under50": 2, "under75": 2, "over75": 0 },
            "power": { "total": 1095, "hi_tech_city": 360, "kondapur": 370, "raidurg": 365 },
            "water": { "treatment_plants": 1, "plant_efficiency": 90, "drinking_water_quality": 95, "avg_water_processed": 250 },
            "stp": { "treatment_plants": 1, "operational_capacity": 120, "avg_sewage_processed": 100, "operational_efficiency": 83 },
            "livability_index": 93.0,
            "drinking_water_index": 90.0,
            "revenue_index": 95.0
        }

        # Create record in DB
        db_obj = self.model(
            smart_bus=mock_data["smart_bus"],
            street_light=mock_data["street_light"],
            cctv=mock_data["cctv"],
            itms=mock_data["itms"],
            environment=mock_data["environment"],
            parking=mock_data["parking"],
            garbage=mock_data["garbage"],
            power=mock_data["power"],
            water=mock_data["water"],
            stp=mock_data["stp"],
            livability_index=mock_data["livability_index"],
            drinking_water_index=mock_data["drinking_water_index"],
            revenue_index=mock_data["revenue_index"]
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
