from backend.db.database import SessionLocal
from backend.models.user_models import FlashcardSet, Flashcard, GlobalVocabCache
from backend.services.ai_service import clean_and_correct_list, enrich_word_batch

def process_deck_generation(deck_id: int, raw_text: str):
    db = SessionLocal()
    try:
        print(f"[Task {deck_id}] Đang xử lý ngầm...")
        
        # 1. Dọn dẹp input
        clean_words = clean_and_correct_list(raw_text)
        if not clean_words: return

        # 2. Check Cache & Gọi AI
        final_data = []
        to_fetch = []

        for word in clean_words:
            cached = db.query(GlobalVocabCache).filter(GlobalVocabCache.word == word).first()
            if cached:
                final_data.append(cached.data)
            else:
                to_fetch.append(word)
        
        if to_fetch:
            ai_results = enrich_word_batch(to_fetch)
            for item in ai_results:
                final_data.append(item)
                db.add(GlobalVocabCache(word=item['word'], data=item))
            db.commit()

        # 3. Lưu vào Deck
        for data in final_data:
            db.add(Flashcard(set_id=deck_id, word=data['word'], data=data))
        
        # 4. Cập nhật trạng thái
        deck = db.query(FlashcardSet).filter(FlashcardSet.id == deck_id).first()
        if deck: deck.description = "Đã hoàn thành "
        db.commit()
        print(f"[Task {deck_id}] Xong!")
        
    except Exception as e:
        print(f"Lỗi Task: {e}")
    finally:
        db.close()