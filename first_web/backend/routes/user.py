from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from pymongo import MongoClient
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

router = APIRouter()

# ✅ MongoDB 연결
client = MongoClient("mongodb+srv://yeseung:joybless1607@cluster0.t690yv5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["project1"]
users_collection = db["users"]

# ✅ JWT, 해시 설정
SECRET_KEY = "1234"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# ✅ 모델
class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ✅ 유틸 함수
def get_user_by_email(email: str):
    return users_collection.find_one({"email": email})

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token error")

# ✅ 회원가입
@router.post("/register")
def register(user: UserCreate):
    if get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
    users_collection.insert_one({
        "email": user.email,
        "hashed_password": hash_password(user.password),
        "favorites": []
    })
    return {"message": "회원가입 성공"}

# ✅ 로그인
@router.post("/login", response_model=Token)
def login(user: UserCreate):
    db_user = get_user_by_email(user.email)
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    access_token = create_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ✅ 내 정보
@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"email": current_user["email"]}
