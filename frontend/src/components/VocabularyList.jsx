import React, { useState } from 'react';
import { Zap, ArrowRight, Maximize2, X, Volume2 } from 'lucide-react'; // Đảm bảo có Volume2
import { playSmartAudio } from '../utils/audioManager'; // Import hàm phát âm

// Import Swiper & Modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Mousewheel, Pagination } from 'swiper/modules';

// Import CSS Swiper
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

// --- 1. THẺ NHỎ (CARD ON WHEEL) ---
const VocabWheelCard = ({ info, index, onExpand }) => {
  
  const handlePlayAudio = (e) => {
    e.stopPropagation(); // Ngăn không cho mở Modal khi bấm loa
    playSmartAudio(info.word);
  };

  return (
    <div className="vocab-card-wrapper" onClick={onExpand}>
      <div className="card-top">
        <span className="index-badge">#{index + 1}</span>
        
        {/* Group nút bấm: Loa + Phóng to */}
        <div style={{display: 'flex', gap: '8px'}}>
            <button className="btn-expand" onClick={handlePlayAudio} title="Listen">
                <Volume2 size={18} />
            </button>
            <button className="btn-expand" title="Expand">
                <Maximize2 size={18} />
            </button>
        </div>
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
        <div className="hint-text">Tap card to explore details</div>
      </div>
    </div>
  );
};

// --- 2. MODAL CHI TIẾT (EXPANDED VIEW) ---
const DetailModal = ({ info, onClose }) => {
  if (!info) return null;

  const handlePlayAudio = (e) => {
    e.stopPropagation();
    playSmartAudio(info.word);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="expanded-card" onClick={(e) => e.stopPropagation()}>
        
        <div className="expanded-header">
          <div>
            <h1 style={{margin:0, fontSize:'2.5rem', lineHeight:1, color:'#fff'}}>{info.word}</h1>
            <div style={{display:'flex', gap:10, marginTop:5, alignItems:'center'}}>
               <span style={{color:'#94a3b8', fontStyle:'italic'}}>{info.ipa}</span>
               <button onClick={handlePlayAudio} style={{background:'none', border:'none', color:'#8b5cf6', cursor:'pointer'}}>
                 <Volume2 size={24}/>
               </button>
            </div>
            <h3 style={{color:'#10b981', margin:'10px 0 0'}}>{info.vietnamese}</h3>
          </div>
          <button className="btn-close" onClick={onClose}><X size={24}/></button>
        </div>

        <div className="expanded-body">
          <div className="section-title">Usage Example</div>
          <p style={{fontStyle:'italic', color:'#e2e8f0', background:'rgba(255,255,255,0.05)', padding:15, borderRadius:8, lineHeight: 1.5}}>
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
              <div className="section-title">Synonyms</div>
              <div className="tag-cloud">
                {info.synonyms.map((s, i) => <span key={i} className="tag-item">{s}</span>)}
              </div>
            </>
          )}

          {info.collocations && info.collocations.length > 0 && (
            <>
              <div className="section-title">Common Collocations</div>
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

// --- COMPONENT CHÍNH (MAIN COMPONENT) ---
const VocabularyList = ({ cards, onStartPractice }) => {
  const [selectedCard, setSelectedCard] = useState(null);

  if (!cards || cards.length === 0) return <div style={{marginTop:50, color:'white', textAlign:'center'}}>Loading vocabulary...</div>;

  return (
    <div className="vocab-wheel-container">
      <div className="vocab-header">
        <h2>Vocab Wheel ({cards.length})</h2>
        <p>Scroll to rotate; Tap card to explore</p>
      </div>

      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        direction={'vertical'}
        mousewheel={true}
        coverflowEffect={{
          rotate: 0,
          stretch: 50,
          depth: 200,
          modifier: 1,
          slideShadows: false,
        }}
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
        
        <SwiperSlide className="vocab-square-slide last-slide">
          <div className="start-card">
            <h3>You have reached the end!</h3>
            <button className="btn-start-neon" onClick={onStartPractice}>
               <Zap size={24} /> <span>Put It Into Practice</span> <ArrowRight size={24}/>
            </button>
          </div>
        </SwiperSlide>
      </Swiper>

      {/* Modal popup when a card is selected */}
      {selectedCard && (
        <DetailModal info={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
};

export default VocabularyList;