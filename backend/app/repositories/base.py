from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from sqlalchemy.orm import Session
from app.models.base import Base

# Define generic model type bound to declarative base
ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    """
    A generic repository class that implements basic CRUD operations using SQLAlchemy.
    Can be inherited and extended by specific repositories.
    """
    def __init__(self, model: Type[ModelType], db: Session) -> None:
        self.model = model
        self.db = db

    def get(self, id: Any) -> Optional[ModelType]:
        """
        Retrieve a single record by primary key.
        """
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_multi(self, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        Retrieve multiple records with pagination.
        """
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, *, obj_in_data: Dict[str, Any]) -> ModelType:
        """
        Create a new database record.
        """
        db_obj = self.model(**obj_in_data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, *, db_obj: ModelType, obj_in_data: Union[Dict[str, Any], Any]) -> ModelType:
        """
        Update an existing database record.
        """
        if isinstance(obj_in_data, dict):
            update_data = obj_in_data
        else:
            update_data = obj_in_data.model_dump(exclude_unset=True)
            
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
                
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def remove(self, *, id: Any) -> Optional[ModelType]:
        """
        Remove a database record by primary key.
        """
        obj = self.db.query(self.model).get(id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
        return obj
