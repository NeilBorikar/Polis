from datetime import datetime
from typing import Tuple, Optional
from pydantic import BaseModel, ConfigDict, model_validator

class IssueBase(BaseModel):
    category: str # 'Pothole', 'Garbage', 'Safety', 'Greenery'
    status: str = "New" # 'New', 'In Progress', 'Resolved'
    description: Optional[str] = None

class IssueCreate(BaseModel):
    category: str
    description: Optional[str] = None
    coordinates: Tuple[float, float, float] # [x, y, z]

class IssueUpdate(BaseModel):
    category: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    verified: Optional[bool] = None
    coordinates: Optional[Tuple[float, float, float]] = None

class IssueResponse(IssueBase):
    id: str
    timestamp: datetime
    verified: bool
    coordinates: Tuple[float, float, float]

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def serialize_coordinates(cls, data: any) -> any:
        # If it's already structured with coordinates, return it
        if isinstance(data, dict) and "coordinates" in data:
            return data
        
        # If it is a dictionary representing DB fields
        if isinstance(data, dict):
            x = data.get("coordinates_x", 0.0)
            y = data.get("coordinates_y", 0.0)
            z = data.get("coordinates_z", 0.0)
            data["coordinates"] = (x, y, z)
            return data
            
        # If it is a database model instance
        x = getattr(data, "coordinates_x", 0.0)
        y = getattr(data, "coordinates_y", 0.0)
        z = getattr(data, "coordinates_z", 0.0)
        
        return {
            "id": getattr(data, "id"),
            "category": getattr(data, "category"),
            "status": getattr(data, "status"),
            "description": getattr(data, "description", None),
            "timestamp": getattr(data, "timestamp"),
            "verified": getattr(data, "verified", False),
            "coordinates": (x, y, z)
        }
