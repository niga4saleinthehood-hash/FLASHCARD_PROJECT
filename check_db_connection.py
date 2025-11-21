import sys
import os

# --- ĐOẠN CODE SỬA LỖI ---
# Lấy đường dẫn tuyệt đối của file này
current_file_path = os.path.abspath(__file__)
# Lấy thư mục chứa file này (tức là thư mục gốc dự án)
project_root = os.path.dirname(current_file_path)
# Thêm thư mục gốc vào danh sách tìm kiếm của Python
sys.path.append(project_root)
# -------------------------

from sqlalchemy import text
from backend.db.database import engine # Bây giờ dòng này sẽ hoạt động

def test_connection():
    print(f"--- 📂 Đang chạy từ thư mục: {os.getcwd()} ---")
    print("--- 🔌 ĐANG KẾT NỐI ĐẾN POSTGRESQL... ---")
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("\n✅ KẾT NỐI THÀNH CÔNG!")
            print(f"URL Database: {engine.url}")
            
    except Exception as e:
        print("\n❌ KẾT NỐI THẤT BẠI!")
        print("Lỗi chi tiết:", e)

if __name__ == "__main__":
    test_connection()