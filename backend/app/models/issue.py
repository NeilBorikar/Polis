import datetime
import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime
from app.models.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Issue(Base):
    __tablename__ = "issues"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    category = Column(String(50), nullable=False) # e.g. 'Pothole', 'Garbage', 'Safety', 'Greenery'
    status = Column(String(50), nullable=False, default="New") # 'New', 'In Progress', 'Resolved'
    
    # Store 3D coordinates individually for performance and indexing, or as separate fields
    coordinates_x = Column(Float, nullable=False, default=0.0)
    coordinates_y = Column(Float, nullable=False, default=0.0)
    coordinates_z = Column(Float, nullable=False, default=0.0)
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    description = Column(String(500), nullable=True)
    verified = Column(Boolean, default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<Issue(id='{self.id}', category='{self.category}', status='{self.status}', verified={self.verified})>"
