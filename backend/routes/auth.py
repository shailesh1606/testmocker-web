from fastapi import APIRouter, Depends, HTTPException, status
from models.user import UserCreate, UserLogin, UserInDB
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from config import settings
from main import app

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expire_hours)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")
    return encoded_jwt

@router.post("/register")
async def register(user: UserCreate):
    existing_user = await app.mongodb["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    user_db = UserInDB(**user.dict(exclude={"password"}), password_hash=hashed_password)
    
    result = await app.mongodb["users"].insert_one(user_db.dict(by_alias=True))
    
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    return {"access_token": access_token}

@router.post("/login")
async def login(user: UserLogin):
    user_doc = await app.mongodb["users"].find_one({"email": user.email})
    if not user_doc or not pwd_context.verify(user.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": str(user_doc["_id"])})
    return {"access_token": access_token}
