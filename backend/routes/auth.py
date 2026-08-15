from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from config import settings
from main import app
from middleware.auth_middleware import get_current_user_id
from models.user import UserCreate, UserLogin, UserInDB, PyObjectId

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
    
    access_token = create_access_token(data={"sub": str(result.inserted_id), "role": user.role})
    return {"access_token": access_token, "role": user.role}

@router.post("/login")
async def login(user: UserLogin):
    user_doc = await app.mongodb["users"].find_one({"email": user.email})
    if not user_doc or not pwd_context.verify(user.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    role = user_doc.get("role", "STUDENT")
    access_token = create_access_token(data={"sub": str(user_doc["_id"]), "role": role})
    return {"access_token": access_token, "role": role}

@router.get("/me")
async def get_me(user_id: PyObjectId = Depends(get_current_user_id)):
    user_doc = await app.mongodb["users"].find_one({"_id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user_doc["_id"]),
        "name": user_doc["name"],
        "email": user_doc["email"],
        "role": user_doc.get("role", "STUDENT"),
        "created_at": user_doc["created_at"]
    }
