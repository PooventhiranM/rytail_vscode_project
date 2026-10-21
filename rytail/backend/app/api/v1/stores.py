from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Store
from app.schemas import StoreOut

router = APIRouter(prefix="/stores", tags=["Store Master"])

@router.get("", response_model=List[StoreOut])
def get_stores(
    region: Optional[str] = None,
    grade: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Store)
    if region:
        query = query.filter(Store.region == region)
    if grade:
        query = query.filter(Store.store_grade == grade)
    if city:
        query = query.filter(Store.city == city)
    return query.all()

@router.get("/{store_code}", response_model=StoreOut)
def get_store_by_code(store_code: str, db: Session = Depends(get_db)):
    return db.query(Store).filter(Store.store_code == store_code).first()
