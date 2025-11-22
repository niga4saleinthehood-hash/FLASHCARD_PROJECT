import { useState, useEffect } from 'react';
import { Send, Sparkles, Volume2 } from 'lucide-react'; // Re-added Volume2
import ReactMarkdown from 'react-markdown';
import { playSmartAudio } from '../utils/audioManager'; // Ensure this import exists

const Flashcard = ({ cardData }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [userSentence, setUserSentence] = useState("");
  
  const [metaData, setMetaData] = useState(null);
  const [streamedFeedback, setStreamedFeedback] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const info = cardData.data;

  useEffect(() => {
    setIsFlipped(false);
    setUserSentence("");
    setMetaData(null);
    setStreamedFeedback("");
    setLoadingText("");
    setIsChecking(false);
  }, [cardData]);

  const handleSpeak = (e) => {
    e.stopPropagation(); // Stop card from flipping
    playSmartAudio(info.word);
  };

  const handleCheck = async () => {
    if (!userSentence.trim()) return;
    
    setIsChecking(true);
    setMetaData(null);
    setStreamedFeedback("");
    setLoadingText("Analysing...");

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(`${API_URL}/check-sentence-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: info.word, sentence: userSentence })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let isSplit = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        if (!isSplit) {
          buffer += chunk;
          if (buffer.includes("|||")) {
            const parts = buffer.split("|||");
            try {
              const jsonPart = JSON.parse(parts[0]);
              setMetaData(jsonPart); 
              setStreamedFeedback(parts[1]); 
              isSplit = true; 
              setLoadingText(""); 
            } catch (e) {}
          }
        } else {
          setStreamedFeedback(prev => prev + chunk);
        }
      }
    } catch (err) {
      setLoadingText("❌ Server connection error.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="practice-container">
      
      {/* --- THẺ LẬT --- */}
      <div 
        className={`practice-card-scene ${isFlipped ? 'flipped' : ''}`} 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="practice-card-inner">
          
          {/* MẶT TRƯỚC */}
          <div className="practice-face practice-front">
            
            {/* Re-added Audio Button */}
            <div style={{position: 'absolute', top: 20, right: 20}}>
               <button className="btn-audio-practice" onClick={handleSpeak}>
                 <Volume2 size={24}/>
               </button>
            </div>
            
            <h2 className="practice-word">{info.word}</h2>
            <p className="practice-ipa">{info.ipa}</p>
            <span className="practice-type">{info.type}</span>
            
            {info.collocations && info.collocations.length > 0 && (
              <div className="front-collo-wrapper">
                {info.collocations.slice(0, 2).map((col, idx) => (
                  <span key={idx} className="front-collo-tag">
                    {col}
                  </span>
                ))}
              </div>
            )}

            <p className="practice-hint">(Touch to reveal the definition)</p>
          </div>

          {/* MẶT SAU */}
          <div className="practice-face practice-back">
            <h3 className="practice-meaning">{info.vietnamese}</h3>
            <hr style={{width: '60%', borderColor: '#334155', margin: '20px 0'}}/>
            <p className="practice-example">"{info.example_sentence}"</p>
          </div>

        </div>
      </div>

      {/* --- LUYỆN TẬP --- */}
      <div className="tools-section">
        <div className="practice-box">
          <div className="practice-label">
             <Sparkles size={18} color="#fbbf24"/>
             <span>Make a sentence for best understanding "{info.word}"</span>
          </div>
          
          <div className="input-wrapper">
            <input 
              value={userSentence}
              onChange={(e) => setUserSentence(e.target.value)}
              placeholder="Enter your sentence here..."
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            />
            <button onClick={handleCheck} disabled={isChecking}>
              <Send size={20} style={{marginLeft: isChecking ? 0 : 2}} />
            </button>
          </div>

          {loadingText && <p style={{color: '#94a3b8', fontStyle: 'italic', marginTop: 15}}>{loadingText}</p>}

          {metaData && (
            <div className={`feedback-card ${metaData.is_correct ? 'success' : 'warning'}`}>
              <div className="feedback-header">
                 <span>AI Evaluation</span>
              </div>
              <div className="correction-box">
                {!metaData.is_correct && (
                  <div className="sentence-wrong">{userSentence}</div>
                )}
                <div className="sentence-correct">{metaData.corrected_sentence}</div>
              </div>
              <div className="explanation-content">
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