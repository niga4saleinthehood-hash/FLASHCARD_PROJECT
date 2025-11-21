from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.db.database import Base

class GlobalVocabCache(Base):
    __tablename__ = "global_vocab_cache"
    word = Column(String, primary_key=True, index=True)
    data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FlashcardSet(Base):
    __tablename__ = "flashcard_sets"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    cards = relationship("Flashcard", back_populates="flashcard_set", cascade="all, delete-orphan")

class Flashcard(Base):
    __tablename__ = "flashcards"
    id = Column(Integer, primary_key=True, index=True)
    set_id = Column(Integer, ForeignKey("flashcard_sets.id"))
    word = Column(String, index=True)
    data = Column(JSONB)
    is_learned = Column(Boolean, default=False)
    flashcard_set = relationship("FlashcardSet", back_populates="cards")