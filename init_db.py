import sys, os
sys.path.append(os.getcwd())
from backend.db.database import engine, Base
from backend.models.user_models import *

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Đã tạo bảng thành công!")