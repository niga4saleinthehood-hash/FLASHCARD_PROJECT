import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. Tải biến môi trường
load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("❌ Lỗi: Không tìm thấy DATABASE_URL trong file .env")

# 2. Tạo Engine kết nối
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# 3. Tạo Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Tạo Base Class
Base = declarative_base()

# 5. Hàm dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()