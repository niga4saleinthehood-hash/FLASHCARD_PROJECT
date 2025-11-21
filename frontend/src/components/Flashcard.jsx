import { useState, useEffect } from 'react';
import { Volume2, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Flashcard = ({ cardData }) => {
  // State quản lý lật thẻ
  const [isFlipped, setIsFlipped] = useState(false);
  
  // State quản lý luyện tập
  const [userSentence, setUserSentence] = useState("");
  
  // State quản lý kết quả AI
  const [metaData, setMetaData] = useState(null);          // Phần JSON (Đúng/Sai)
  const [streamedFeedback, setStreamedFeedback] = useState(""); // Phần giải thích (Text chạy)
  const [isChecking, setIsChecking] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const info = cardData.data;

  // Reset mọi thứ khi chuyển sang thẻ mới
  useEffect(() => {
    setIsFlipped(false);
    setUserSentence("");
    setMetaData(null);
    setStreamedFeedback("");
    setLoadingText("");
    setIsChecking(false);
  }, [cardData]);

  // Hàm đọc từ
  const handleSpeak = (e) => {
    e.stopPropagation(); // Ngăn không cho lật thẻ khi bấm loa
    const utterance = new SpeechSynthesisUtterance(info.word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  // Hàm gọi AI kiểm tra câu (Logic Tách Luồng Hybrid)
  const handleCheck = async () => {
    if (!userSentence.trim()) return;
    
    setIsChecking(true);
    setMetaData(null);
    setStreamedFeedback("");
    setLoadingText("AI is on the way .....");

    try {
      const response = await fetch('http://127.0.0.1:8000/api/check-sentence-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: info.word, sentence: userSentence })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = "";
      let isSplit = false; // Cờ đánh dấu đã tách được phần JSON chưa

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        if (!isSplit) {
          // Giai đoạn 1: Tìm dấu ngăn cách |||
          buffer += chunk;
          if (buffer.includes("|||")) {
            const parts = buffer.split("|||");
            try {
              // Parse phần đầu (JSON) để hiện hộp kết quả ngay lập tức
              const jsonPart = JSON.parse(parts[0]);
              setMetaData(jsonPart); 
              
              // Phần sau là lời giải thích -> bắt đầu stream
              setStreamedFeedback(parts[1]); 
              
              isSplit = true; 
              setLoadingText(""); // Tắt loading
            } catch (e) {
              // Nếu chưa nhận đủ JSON, đợi chunk tiếp theo
            }
          }
        } else {
          // Giai đoạn 2: Đã tách xong, cứ có chữ là in ra (True Streaming)
          setStreamedFeedback(prev => prev + chunk);
        }
      }

    } catch (err) {
      setLoadingText("❌ Lỗi kết nối server.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    // Container chính (Căn giữa toàn bộ)
    <div className="practice-container">
      
      {/* --- 1. THẺ FLASHCARD (LẬT 3D) --- */}
      <div 
        className={`practice-card-scene ${isFlipped ? 'flipped' : ''}`} 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="practice-card-inner">
          
          {/* MẶT TRƯỚC */}
          <div className="practice-face practice-front">
            {/* Nút loa nằm góc phải trên */}
            <div className="btn-audio-top-right">
               <button className="btn-audio-practice" onClick={handleSpeak}>
                 <Volume2 size={24}/>
               </button>
            </div>

            {/* Nội dung chính căn giữa */}
            <h2 className="practice-word">{info.word}</h2>
            <p className="practice-ipa">{info.ipa}</p>
            <span className="practice-type">{info.type}</span>
            
            {/* Dòng nhắc nhở nằm sát đáy */}
            <p className="practice-hint">(TAP TO OBSERVE THE MEANING)</p>
          </div>

          {/* MẶT SAU */}
          <div className="practice-face practice-back">
            <h3 className="practice-meaning">{info.vietnamese}</h3>
            <hr style={{width: '60%', borderColor: '#334155', margin: '20px 0'}}/>
            <p className="practice-example">"{info.example_sentence}"</p>
          </div>

        </div>
      </div>

      {/* --- 2. KHU VỰC LUYỆN TẬP (INPUT + KẾT QUẢ) --- */}
      <div className="tools-section">
        <div className="practice-box">
          
          <div className="practice-label">
             <Sparkles size={18} color="#fbbf24"/>
             <span>Make a sentence for deep understand"{info.word}"</span>
          </div>
          
          {/* Ô nhập liệu hình viên thuốc */}
          <div className="input-wrapper">
            <input 
              value={userSentence}
              onChange={(e) => setUserSentence(e.target.value)}
              placeholder="Nhập câu ví dụ của bạn..."
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            />
            <button onClick={handleCheck} disabled={isChecking}>
              <Send size={20} style={{marginLeft: isChecking ? 0 : 2}} />
            </button>
          </div>

          {/* Text loading khi đang chờ kết nối */}
          {loadingText && <p style={{color: '#94a3b8', fontStyle: 'italic', marginTop: 15}}>{loadingText}</p>}

          {/* Hiển thị kết quả phân tích */}
          {metaData && (
            <div className={`feedback-card ${metaData.is_correct ? 'success' : 'warning'}`}>
              
              {/* Header */}
              <div className="feedback-header">
                 <span>AI valuation</span>
              </div>

              {/* So sánh câu đúng/sai */}
              <div className="correction-box">
                {!metaData.is_correct && (
                  <div className="sentence-wrong">{userSentence}</div>
                )}
                <div className="sentence-correct">{metaData.corrected_sentence}</div>
              </div>

              {/* Lời giải thích (Markdown Streaming) */}
              <div className="explanation-content">
                {/* Hiệu ứng con trỏ nhấp nháy khi đang stream */}
                {!streamedFeedback && isChecking && <span className="animate-pulse">▋</span>}
                <ReactMarkdown>{streamedFeedback}</ReactMarkdown>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default Flashcard;