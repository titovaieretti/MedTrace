from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationRead

router = APIRouter()


@router.get("", response_model=list[LocationRead])
def list_locations(db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> list[Location]:
    return db.query(Location).order_by(Location.nombre.asc()).all()


@router.post("", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def create_location(
    payload: LocationCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Location:
    location = Location(**payload.model_dump())
    db.add(location)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Location already exists") from exc
    db.refresh(location)
    return location
