from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.issue import IssueCreate, IssueUpdate, IssueResponse
from app.repositories.issue_repository import IssueRepository
from app.api.deps import get_issue_repository

router = APIRouter(prefix="/api/issues", tags=["Issues"])

@router.get("", response_model=List[IssueResponse])
def get_all_issues(
    skip: int = 0,
    limit: int = 100,
    repo: IssueRepository = Depends(get_issue_repository)
) -> List[IssueResponse]:
    """
    Get all city issues with pagination support.
    """
    return repo.get_multi(skip=skip, limit=limit)

@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
    issue_in: IssueCreate,
    repo: IssueRepository = Depends(get_issue_repository)
) -> IssueResponse:
    """
    Create a new issue reporting a problem in the city.
    """
    return repo.create_issue(obj_in=issue_in)

@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue_by_id(
    issue_id: str,
    repo: IssueRepository = Depends(get_issue_repository)
) -> IssueResponse:
    """
    Get details of a specific issue.
    """
    db_obj = repo.get(id=issue_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with ID {issue_id} not found."
        )
    return db_obj

@router.patch("/{issue_id}", response_model=IssueResponse)
def update_issue(
    issue_id: str,
    issue_update: IssueUpdate,
    repo: IssueRepository = Depends(get_issue_repository)
) -> IssueResponse:
    """
    Update attributes of an existing issue.
    """
    db_obj = repo.get(id=issue_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with ID {issue_id} not found."
        )
    return repo.update_issue(db_obj=db_obj, obj_in=issue_update)

@router.patch("/{issue_id}/status", response_model=IssueResponse)
def update_issue_status(
    issue_id: str,
    status_str: str, # 'New', 'In Progress', 'Resolved'
    repo: IssueRepository = Depends(get_issue_repository)
) -> IssueResponse:
    """
    Update the status of an issue (New -> In Progress -> Resolved).
    """
    db_obj = repo.get(id=issue_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with ID {issue_id} not found."
        )
    
    # Simple validation
    valid_statuses = {"New", "In Progress", "Resolved"}
    if status_str not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
        
    update_data = IssueUpdate(status=status_str)
    # If resolving, also set verified to True (standard flow in frontend)
    if status_str == "Resolved":
        update_data.verified = True
        
    return repo.update_issue(db_obj=db_obj, obj_in=update_data)

@router.post("/{issue_id}/resolve", response_model=IssueResponse)
def resolve_issue(
    issue_id: str,
    repo: IssueRepository = Depends(get_issue_repository)
) -> IssueResponse:
    """
    Mark an issue as Resolved and verified.
    """
    db_obj = repo.get(id=issue_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with ID {issue_id} not found."
        )
    update_data = IssueUpdate(status="Resolved", verified=True)
    return repo.update_issue(db_obj=db_obj, obj_in=update_data)
