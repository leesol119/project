from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta

router = APIRouter()

# ✅ MongoDB 연결
client = MongoClient("mongodb+srv://yeseung:joybless1607@cluster0.t690yv5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["project1"]
users_collection = db["users"]

# ✅ 인증 관련 설정
SECRET_KEY = "1234"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# ✅ 모델
class FavoriteRequest(BaseModel):
    companyName: str

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token error")

# ✅ 즐겨찾기 추가
@router.post("/favorites")
def add_favorite(fav: FavoriteRequest, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    if fav.companyName in current_user.get("favorites", []):
        raise HTTPException(status_code=400, detail="이미 즐겨찾기에 등록된 회사입니다.")
    users_collection.update_one(
        {"email": email},
        {"$push": {"favorites": fav.companyName}}
    )
    return {"message": "즐겨찾기 추가 성공"}

# ✅ 즐겨찾기 삭제
@router.delete("/favorites/{companyName}")
def delete_favorite(companyName: str, current_user: dict = Depends(get_current_user)):
    users_collection.update_one(
        {"email": current_user["email"]},
        {"$pull": {"favorites": companyName}}
    )
    return {"message": "즐겨찾기 삭제 성공"}

# ✅ 즐겨찾기 목록 조회
@router.get("/favorites", response_model=List[str])
def get_favorites(current_user: dict = Depends(get_current_user)):
    return current_user.get("favorites", [])
