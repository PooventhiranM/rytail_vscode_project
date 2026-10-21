from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.schemas import UserLogin, Token, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or user.hashed_password != login_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Available seed accounts: admin/adminpassword, merchandiser/merchpassword, planner/plannerpassword, business/businesspassword, data_eng/datapassword."
        )
    return Token(
        access_token=f"token_{user.username}_2026",
        token_type="bearer",
        username=user.username,
        role=user.role
    )

@router.get("/me", response_model=UserOut)
def get_current_user(username: str = "merchandiser", db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = db.query(User).first()
    return user
