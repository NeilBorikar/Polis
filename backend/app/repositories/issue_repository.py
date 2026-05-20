from sqlalchemy.orm import Session
from app.models.issue import Issue
from app.schemas.issue import IssueCreate, IssueUpdate
from app.repositories.base import BaseRepository

class IssueRepository(BaseRepository[Issue]):
    """
    Repository for Issue database operations.
    Handles mapping between frontend schema formats (like coordinate array)
    and backend DB columns (x, y, z floats).
    """
    def __init__(self, db: Session) -> None:
        super().__init__(Issue, db)

    def create_issue(self, *, obj_in: IssueCreate) -> Issue:
        """
        Custom create method that unpacks coordinates tuple into individual columns.
        """
        x, y, z = obj_in.coordinates
        obj_in_data = {
            "category": obj_in.category,
            "description": obj_in.description,
            "coordinates_x": x,
            "coordinates_y": y,
            "coordinates_z": z,
            "status": "New",
            "verified": False
        }
        return self.create(obj_in_data=obj_in_data)

    def update_issue(self, *, db_obj: Issue, obj_in: IssueUpdate) -> Issue:
        """
        Custom update method that handles coordinates tuple updates if present.
        """
        update_data = obj_in.model_dump(exclude_unset=True)
        if "coordinates" in update_data and update_data["coordinates"] is not None:
            x, y, z = update_data.pop("coordinates")
            update_data["coordinates_x"] = x
            update_data["coordinates_y"] = y
            update_data["coordinates_z"] = z
            
        return self.update(db_obj=db_obj, obj_in_data=update_data)
