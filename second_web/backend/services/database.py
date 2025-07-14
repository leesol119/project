# backend/services/database.py
from pymongo import MongoClient

MONGO_URL = "" 
client = MongoClient(MONGO_URL)

db = client["login"]  # DB 이름
users_collection = db["users"]  # 회원정보 저장 컬렉션
