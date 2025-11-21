import React, { useState } from 'react';
import { Volume2, Zap, ArrowRight, Maximize2, X } from 'lucide-react';

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Mousewheel, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

const VocabWheelCard = ({ info, index, onExpand }) => {
  
  const playAudio = (e) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(info.word);
    speechSynthesis.speak(utterance);
  };

  return (
    // Khi click vào thẻ -> Gọi hàm onExpand để mở Modal
    <div className="vocab-card-wrapper" onClick={onExpand}>
      
      <div className="card-top">
        <span className="index-badge">#{index + 1}</span>
        <button className="btn-expand" title="Xem chi tiết">
          <Maximize2 size={16} />
        </button>
      </div>

      <div className="card-main">
        <h2 className="word-main">{info.word}</h2>
        <div className="meta-group">
          <span className="ipa">{info.ipa}</span>
          <span className="type">{info.type}</span>
        </div>
        <h3 className="meaning">{info.vietnamese}</h3>
      </div>

      <div className="card-footer">
        <div className="hint-text">
          <Volume2 size={14} /> Listen & more details
        </div>
      </div>

    </div>
  );
};

// --- 2. MODAL CHI TIẾT (POPUP) ---
const DetailModal = ({ info, onClose }) => {
  if (!info) return null;

  const playAudio = () => {
    const utterance = new SpeechSynthesisUtterance(info.word);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="expanded-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Modal */}
        <div className="expanded-header">
          <div>
            <h1 style={{margin:0, fontSize:'2.5rem', lineHeight:1}}>{info.word}</h1>
            <div style={{display:'flex', gap:10, marginTop:5, alignItems:'center'}}>
               <span style={{color:'#94a3b8', fontStyle:'italic'}}>{info.ipa}</span>
               <button onClick={playAudio} style={{background:'none', border:'none', color:'#8b5cf6', cursor:'pointer'}}><Volume2 size={24}/></button>
            </div>
            <h3 style={{color:'#10b981', margin:'10px 0 0'}}>{info.vietnamese}</h3>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20}/></button>
        </div>

        {/* Body Modal (Cuộn được) */}
        <div className="expanded-body">
          
          <div className="section-title">Example</div>
          <p style={{fontStyle:'italic', color:'#e2e8f0', background:'rgba(255,255,255,0.05)', padding:10, borderRadius:8}}>
            "{info.example_sentence}"
          </p>

          {info.word_family && Object.values(info.word_family).some(x=>x) && (
            <>
              <div className="section-title">Word Family</div>
              {Object.entries(info.word_family).map(([k, v]) => v && (
                <div key={k} className="family-row">
                  <span className="lbl">{k}:</span> {v}
                </div>
              ))}
            </>
          )}

          {info.synonyms && info.synonyms.length > 0 && (
            <>
              <div className="section-title">Synonym</div>
              <div className="tag-cloud">
                {info.synonyms.map((s, i) => <span key={i} className="tag-item">{s}</span>)}
              </div>
            </>
          )}

          {info.collocations && info.collocations.length > 0 && (
            <>
              <div className="section-title">Collocation</div>
              <ul className="collo-list">
                {info.collocations.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH ---
const VocabularyList = ({ cards, onStartPractice }) => {
  const [selectedCard, setSelectedCard] = useState(null);

  if (!cards || cards.length === 0) return <div style={{marginTop:50, color:'white'}}>Loading...</div>;

  return (
    <div className="vocab-wheel-container">
      <div className="vocab-header">
        <h2>You want 9.0 IELTS overall ? Learn by heart and practice ({cards.length})</h2>
        <p>Scroll down and click on card for more details</p>
      </div>

      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        direction={'vertical'}
        mousewheel={true}
        coverflowEffect={{ rotate: 0, stretch: 50, depth: 200, modifier: 1, slideShadows: false }}
        modules={[EffectCoverflow, Mousewheel, Pagination]}
        className="mySwiper"
      >
        {cards.map((card, index) => (
          <SwiperSlide key={card.id} className="vocab-square-slide">
            <VocabWheelCard 
              info={card.data} 
              index={index} 
              onExpand={() => setSelectedCard(card.data)} 
            />
          </SwiperSlide>
        ))}
        
        {/* SLIDE CUỐI CÙNG: NÚT BẮT ĐẦU (Dùng Inline Style để ép giao diện đổi) */}
        <SwiperSlide className="vocab-square-slide last-slide">
          <div 
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '25px',
              
              // Hiệu ứng kính mờ & Viền Neon
              background: 'rgba(15, 23, 42, 0.85)', 
              backdropFilter: 'blur(12px)',
              border: '3px dashed #8b5cf6',
              borderRadius: '30px',
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.25)'
            }}
          >
            <h3 
              style={{
                fontSize: '1.8rem',
                fontWeight: '900',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                
                // Màu chữ Gradient
                background: 'linear-gradient(to right, #fff, #d8b4fe)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              CONGRATULATION. YOU'VE FINISHED ALL THOSE WORDS
            </h3>

            <button 
              onClick={onStartPractice} 
              style={{
                // Nền Gradient Tím -> Hồng
                background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                color: 'white',
                border: 'none',
                
                // Kích thước to đẹp
                padding: '16px 32px',
                fontSize: '1.1rem',
                fontWeight: '800',
                borderRadius: '50px',
                
                // Flexbox căn chỉnh icon
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                
                // Hiệu ứng bóng đổ phát sáng
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.6)',
                transition: 'transform 0.2s'
              }}
              // Thêm hiệu ứng hover bằng JS đơn giản
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
               <Zap size={24} fill="white" /> 
               <span>PUT IT INTO PRACTICE</span> 
               <ArrowRight size={24}/>
            </button>
          </div>
        </SwiperSlide>
      </Swiper>

      {/* Hiển thị Modal khi có thẻ được chọn */}
      {selectedCard && (
        <DetailModal info={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
};

export default VocabularyList;