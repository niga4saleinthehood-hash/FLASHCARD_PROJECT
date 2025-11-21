from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # <-- Import cái này
from backend.api import endpoints

app = FastAPI()

# --- CẤU HÌNH CORS (MỞ CỬA CHO FRONTEND) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép mọi nguồn (Frontend nào cũng vào được)
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép mọi hành động (POST, GET...)
    allow_headers=["*"],
)
# -------------------------------------------

app.include_router(endpoints.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "AI Flashcard System is Running!"}