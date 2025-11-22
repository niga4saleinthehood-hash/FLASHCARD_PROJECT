import { useState, useEffect } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import Flashcard from './components/Flashcard';
import VocabularyList from './components/VocabularyList';
import { getDeck } from './api/deckApi';
import { ChevronLeft, ChevronRight, BookOpen, List } from 'lucide-react';

function App() {
  const [currentDeckId, setCurrentDeckId] = useState(null);
  const [deckData, setDeckData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  
  // State mới: Kiểm tra xem Backend đã xong hoàn toàn chưa
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  const handleUploadSuccess = (deckId) => {
    setCurrentDeckId(deckId);
    setDeckData(null);
    setCurrentIndex(0);
    setViewMode('list');
    setIsFullyLoaded(false); // Reset trạng thái
  };

  useEffect(() => {
    if (!currentDeckId || isFullyLoaded) return;

    const interval = setInterval(async () => {
      try {
        const data = await getDeck(currentDeckId);
        
        // Nếu có dữ liệu mới
        if (data.cards && data.cards.length > 0) {
          // Cập nhật dữ liệu (React sẽ tự render thêm thẻ mới vào danh sách)
          setDeckData(data);
          
          // Kiểm tra xem Backend đã xong việc chưa
          // (Dựa vào mô tả description có dấu tick ✅ hoặc logic riêng)
          if (data.description && data.description.includes("✅")) {
            setIsFullyLoaded(true);
            console.log("Đã tải xong toàn bộ!");
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000); // Hỏi mỗi 3 giây

    return () => clearInterval(interval);
  }, [currentDeckId, isFullyLoaded]);

  const resetApp = () => {
    setCurrentDeckId(null);
    setDeckData(null);
    setViewMode('list');
    setIsFullyLoaded(false);
  };

  return (
    <div className="container">
      <h1>AI Vocabulary Booster</h1>
      
      {!currentDeckId && (
        <>
          <p className="subtitle">Enhance English lexical competence using an intelligent, standardized learning framework</p>
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        </>
      )}

      {/* CHỈ HIỆN LOADING KHI CHƯA CÓ THẺ NÀO */}
      {currentDeckId && (!deckData || deckData.cards.length === 0) && (
        <div style={{marginTop: 100}}>
          <h2>⏳ Initializing the vocabulary set…</h2>
          <p className="subtitle">The initial vocabulary items will appear within a few seconds</p>
        </div>
      )}

      {deckData && deckData.cards.length > 0 && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#94a3b8'}}>
            <BookOpen size={18}/> 
            Bộ thẻ: <strong>{deckData.title}</strong>
            {/* Hiển thị trạng thái loading nhỏ nếu chưa xong hết */}
            {!isFullyLoaded && <span style={{fontSize:'0.8rem', color:'#eab308'}}>(Retrieving further data...)</span>}
          </div>

          {viewMode === 'list' && (
            <VocabularyList 
              cards={deckData.cards} 
              onStartPractice={() => setViewMode('flashcard')} 
            />
          )}

          {viewMode === 'flashcard' && (
            <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <button 
                onClick={() => setViewMode('list')}
                style={{background: 'transparent', border: 'none', color: '#8b5cf6', cursor: 'pointer', marginBottom: 10, display: 'flex', gap: 5}}
              >
                <List size={16}/> Review the vocabulary list
              </button>

              <div className="study-wrapper">
                <button 
                  className="nav-btn" 
                  onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={32} />
                </button>

                {/* Kiểm tra an toàn để tránh lỗi khi index vượt quá mảng đang load */}
                {deckData.cards[currentIndex] && (
                  <Flashcard cardData={deckData.cards[currentIndex]} />
                )}

                <button 
                  className="nav-btn" 
                  onClick={() => setCurrentIndex(i => Math.min(deckData.cards.length - 1, i + 1))}
                  disabled={currentIndex === deckData.cards.length - 1}
                >
                  <ChevronRight size={32} />
                </button>
              </div>
              
              <p style={{marginTop: 20, color: '#64748b'}}>
                Card {currentIndex + 1} / {deckData.cards.length} {!isFullyLoaded ? '...' : ''}
              </p>
              
              <button 
                onClick={resetApp}
                style={{marginTop: 50, background: '#334155', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer'}}
              >
                ⬅️ Switch to another vocabulary set
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default App;