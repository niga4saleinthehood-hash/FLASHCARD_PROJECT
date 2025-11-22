from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse # <-- Import quan trọng cho Streaming
from pydantic import BaseModel # <-- Để định nghĩa body gửi lên
from sqlalchemy.orm import Session
from backend.services.file_parser import extract_text_from_file
from backend.db.database import get_db
from backend.models.user_models import FlashcardSet
from backend.services.deck_service import process_deck_generation
# Import thêm hàm stream mới
from backend.services.ai_service import check_user_sentence_stream 

from fastapi import HTTPException
# Thêm joinedload vào dòng import sqlalchemy.orm
from sqlalchemy.orm import Session, joinedload
router = APIRouter()

# Định nghĩa dữ liệu user gửi lên để check câu
class SentenceRequest(BaseModel):
    word: str
    sentence: str

@router.post("/upload-notes")
async def upload_notes(
    bg_tasks: BackgroundTasks, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # --- SỬ DỤNG HÀM MỚI ĐỂ ĐỌC FILE ---
    text_content = await extract_text_from_file(file)
    
    # Kiểm tra nếu file rỗng hoặc không đọc được
    if not text_content or not text_content.strip():
        return {"message": "Lỗi: Không đọc được nội dung file hoặc file rỗng!", "status": "error"}
    
    # --- CÁC PHẦN DƯỚI GIỮ NGUYÊN ---
    new_deck = FlashcardSet(title=f"File: {file.filename}", description="⏳ Đang xử lý...")
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)
    
    bg_tasks.add_task(process_deck_generation, new_deck.id, text_content)
    
    return {"message": "Received", "deck_id": new_deck.id}
# API MỚI: STREAMING FEEDBACK 🌊
@router.post("/check-sentence-stream")
async def check_sentence_stream(request: SentenceRequest):
    """
    API này trả về dữ liệu dạng dòng chảy (stream).
    Client sẽ nhận được từng ký tự JSON ngay khi AI sinh ra.
    """
    # Gọi hàm generator
    data_stream = check_user_sentence_stream(request.word, request.sentence)
    
    # Trả về StreamingResponse
    return StreamingResponse(data_stream, media_type="application/json")

@router.get("/decks/{deck_id}")
def get_deck(deck_id: int, db: Session = Depends(get_db)):
    """
    API lấy toàn bộ thông tin và thẻ của một bộ (Deck).
    Sử dụng joinedload để lấy luôn các thẻ con.
    """
    # SỬA Ở ĐÂY: Thêm .options(joinedload(FlashcardSet.cards))
    deck = db.query(FlashcardSet).options(joinedload(FlashcardSet.cards)).filter(FlashcardSet.id == deck_id).first()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Không tìm thấy bộ thẻ này")
    
    return deck