import requests
import sys

url = "http://127.0.0.1:8000/api/check-sentence-stream"

payload = {
    "word": "collaborate",
    "sentence": "I want collaborate with you." # Câu thiếu "to"
}

print("--- 🚀 ĐANG GỬI CÂU HỎI VÀ CHỜ STREAM... ---")

# stream=True ở đây là client báo "tôi muốn nhận stream"
with requests.post(url, json=payload, stream=True) as r:
    print("--- 👇 BẮT ĐẦU NHẬN DỮ LIỆU 👇 ---\n")
    for chunk in r.iter_content(chunk_size=10, decode_unicode= True): # Nhận từng miếng nhỏ (10 bytes)
        if chunk:
            # In ra ngay lập tức không xuống dòng (flush=True)
            print(chunk, end='', flush=True)

print("\n\n--- ✅ KẾT THÚC STREAM ---")