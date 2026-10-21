from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Product
from app.schemas import ProductOut

router = APIRouter(prefix="/products", tags=["Product Master"])

@router.get("", response_model=List[ProductOut])
def get_products(
    brand: Optional[str] = None,
    division: Optional[str] = None,
    department: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if brand:
        query = query.filter(Product.brand == brand)
    if division:
        query = query.filter(Product.division == division)
    if department:
        query = query.filter(Product.department == department)
    if category:
        query = query.filter(Product.category == category)
    return query.all()

@router.get("/{sku}", response_model=ProductOut)
def get_product_by_sku(sku: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.sku == sku).first()
    return p
