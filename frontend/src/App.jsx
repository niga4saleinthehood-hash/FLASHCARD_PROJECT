import { useState, useEffect } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import Flashcard from './components/Flashcard';
import VocabularyList from './components/VocabularyList'; // Import component mới
import { getDeck } from './api/deckApi';
import { ChevronLeft, ChevronRight, BookOpen, List } from 'lucide-react';

function App() {
  const [currentDeckId, setCurrentDeckId] = useState(null);
  const [deckData, setDeckData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // State mới: Quản lý chế độ xem ('list' hoặc 'flashcard')
  const [viewMode, setViewMode] = useState('list'); 

  const handleUploadSuccess = (deckId) => {
    setCurrentDeckId(deckId);
    setDeckData(null);
    setCurrentIndex(0);
    setViewMode('list'); // Mặc định sau khi upload là xem List trước
  };

  useEffect(() => {
    if (!currentDeckId || deckData) return;
    const interval = setInterval(async () => {
      try {
        const data = await getDeck(currentDeckId);
        if (data.cards && data.cards.length > 0) setDeckData(data);
      } catch (error) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [currentDeckId, deckData]);

  // Hàm quay về menu chính
  const resetApp = () => {
    setCurrentDeckId(null);
    setDeckData(null);
    setViewMode('list');
  };

  return (
    <div className="container">
      <h1>AI Vocabulary Booster</h1>
      
      {!currentDeckId && (
        <>
          <p className="subtitle">ENHANCE YOUR VOCAB RIGHT NOW FOR A BETTER IELTS BAND SCORE</p>
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        </>
      )}

      {currentDeckId && !deckData && (
        <div style={{marginTop: 100}}>
          <h2>⏳ Initializing the vocabulary set...</h2>
          <p className="subtitle">AI is analyzing the meanings and finding accurate examples</p>
        </div>
      )}

      {/* KHI ĐÃ CÓ DỮ LIỆU */}
      {deckData && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          
          {/* Thanh tiêu đề nhỏ hiển thị tên bộ thẻ */}
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#94a3b8'}}>
            <BookOpen size={18}/> Card set: <strong>{deckData.title}</strong>
          </div>

          {/* --- MÀN HÌNH 1: CHẾ ĐỘ DANH SÁCH (HỌC) --- */}
          {viewMode === 'list' && (
            <VocabularyList 
              cards={deckData.cards} 
              onStartPractice={() => setViewMode('flashcard')} 
            />
          )}

          {/* --- MÀN HÌNH 2: CHẾ ĐỘ FLASHCARD (LUYỆN TẬP) --- */}
          {viewMode === 'flashcard' && (
            <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              
              {/* Nút quay lại xem list */}
              <button 
                onClick={() => setViewMode('list')}
                style={{background: 'transparent', border: 'none', color: '#8b5cf6', cursor: 'pointer', marginBottom: 10, display: 'flex', gap: 5}}
              >
                <List size={16}/> Review the word list
              </button>

              <div className="study-wrapper">
                <button 
                  className="nav-btn" 
                  onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={32} />
                </button>

                <Flashcard cardData={deckData.cards[currentIndex]} />

                <button 
                  className="nav-btn" 
                  onClick={() => setCurrentIndex(i => Math.min(deckData.cards.length - 1, i + 1))}
                  disabled={currentIndex === deckData.cards.length - 1}
                >
                  <ChevronRight size={32} />
                </button>
              </div>
              
              <p style={{marginTop: 20, color: '#64748b'}}>
                Thẻ {currentIndex + 1} / {deckData.cards.length}
              </p>
              
              {/* Nút hoàn thành */}
              <button 
                onClick={resetApp}
                style={{marginTop: 50, background: '#334155', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer'}}
              >
                ⬅️ Switch to another set
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default App;