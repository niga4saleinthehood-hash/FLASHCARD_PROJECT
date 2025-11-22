import time
from backend.db.database import SessionLocal
from backend.models.user_models import FlashcardSet, Flashcard, GlobalVocabCache
from backend.services.ai_service import clean_and_correct_list, enrich_word_batch

def process_deck_generation(deck_id: int, raw_text: str):
    """
    Logic xử lý ngầm:
    1. Dọn dẹp từ.
    2. Tách từ mới/cũ.
    3. Chia từ mới thành các nhóm nhỏ (Chunking) để gọi AI an toàn.
    4. Lưu tất cả vào DB.
    """
    db = SessionLocal()
    try:
        print(f"⏳ [Task {deck_id}] Bắt đầu xử lý...")
        
        # 1. Dọn dẹp input
        all_clean_words = clean_and_correct_list(raw_text)
        
        if not all_clean_words:
            print("   -> Không tìm thấy từ nào hợp lệ.")
            return

        total_words = len(all_clean_words)
        print(f"   -> Tổng cộng: {total_words} từ cần xử lý.")

        final_flashcard_data = [] # Nơi chứa kết quả cuối cùng
        words_to_fetch_ai = []    # Danh sách các từ chưa có trong Cache

        # 2. Kiểm tra Cache (Lọc ra những từ đã có sẵn)
        for word in all_clean_words:
            cached = db.query(GlobalVocabCache).filter(GlobalVocabCache.word == word).first()
            if cached:
                final_flashcard_data.append(cached.data)
            else:
                words_to_fetch_ai.append(word)
        
        print(f"   -> Có sẵn trong Cache: {len(final_flashcard_data)} từ.")
        print(f"   -> Cần hỏi AI: {len(words_to_fetch_ai)} từ.")

        # 3. XỬ LÝ CHUNKING (CHIA NHỎ ĐỂ GỌI AI)
        # Mỗi lần gọi tối đa 15 từ để đảm bảo AI trả lời đủ và không bị lỗi timeout
        BATCH_SIZE = 15 
        
        # Cắt danh sách thành nhiều khúc: [[15 từ], [15 từ], [5 từ]...]
        chunks = [words_to_fetch_ai[i:i + BATCH_SIZE] for i in range(0, len(words_to_fetch_ai), BATCH_SIZE)]

        for index, chunk in enumerate(chunks):
            print(f"   ⚡ Đang xử lý Batch {index + 1}/{len(chunks)} ({len(chunk)} từ)...")
            
            # Gọi AI
            ai_results = enrich_word_batch(chunk)
            
            # Lưu kết quả của Batch này
            for item in ai_results:
                final_flashcard_data.append(item)
                
                # Lưu ngay vào Cache để dùng cho lần sau
                # Kiểm tra trùng lần nữa cho an toàn
                if not db.query(GlobalVocabCache).filter(GlobalVocabCache.word == item['word']).first():
                    db.add(GlobalVocabCache(word=item['word'], data=item))
            
            db.commit() # Lưu Cache ngay lập tức
            
            # Nghỉ 2 giây giữa các lần gọi để tránh bị Google chặn (Rate Limit)
            if index < len(chunks) - 1:
                time.sleep(2)

        # 4. Lưu tất cả vào Bộ thẻ (Deck) của User
        print(f"   💾 Đang lưu {len(final_flashcard_data)} thẻ vào bộ sưu tập...")
        for data in final_flashcard_data:
            new_card = Flashcard(
                set_id=deck_id,
                word=data['word'],
                data=data
            )
            db.add(new_card)
        
        # 5. Cập nhật trạng thái Deck là Hoàn thành
        deck = db.query(FlashcardSet).filter(FlashcardSet.id == deck_id).first()
        if deck:
            deck.description = f"Đã hoàn thành ✅ ({len(final_flashcard_data)} từ)"
            db.add(deck)

        db.commit()
        print(f"✅ [Task {deck_id}] HOÀN TẤT! User đã có thẻ để học.")

    except Exception as e:
        print(f"❌ [Task {deck_id}] Lỗi nghiêm trọng: {e}")
    finally:
        db.close()