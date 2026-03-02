from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.batch import CustodyEventRead
from app.schemas.custody import CustodyEventCreate, CustodySyncRequest, CustodySyncResponse
from app.services.custody_service import CustodyService

router = APIRouter()


@router.post("", response_model=CustodyEventRead, status_code=status.HTTP_201_CREATED)
def create_custody_event(
    payload: CustodyEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CustodyEventRead:
    event = CustodyService(db).create_event(payload, actor=current_user)
    return event


@router.post("/sync", response_model=CustodySyncResponse)
def sync_custody_events(
    payload: CustodySyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CustodySyncResponse:
    return CustodyService(db).sync_events(payload, actor=current_user)
