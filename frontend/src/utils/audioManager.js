export const playSmartAudio = async (text) => {
  if (!text) return;

  // 1. Dọn dẹp văn bản (xóa khoảng trắng thừa, chuyển thường)
  const cleanText = text.trim().toLowerCase();

  // Chỉ áp dụng nếu text ngắn (dưới 4 từ) vì từ điển không chứa câu dài
  if (cleanText.split(' ').length <= 4) {
    try {
      // Gọi API Từ điển miễn phí
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanText}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Tìm file audio trong dữ liệu trả về
        // API này trả về nhiều nguồn, ta tìm cái nào có link file mp3
        if (Array.isArray(data) && data.length > 0) {
          const phonetics = data[0].phonetics;
          const audioObj = phonetics.find(p => p.audio && p.audio !== "");
          
          if (audioObj) {
            const audio = new Audio(audioObj.audio);
            audio.play();
            console.log(`Đang phát giọng thật: "${cleanText}"`);
            return; // Thành công! Dừng hàm tại đây.
          }
        }
      }
    } catch (error) {
      // Lỗi mạng hoặc không tìm thấy -> Bỏ qua để xuống bước sau
    }
  }

  // Dùng khi: Không tìm thấy từ điển, hoặc là câu dài
  console.log(`Đang phát giọng máy: "${text}"`);
  
  // Hủy các giọng đang đọc dở (nếu có)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; // Giọng Mỹ
  utterance.rate = 0.9;     // Tốc độ hơi chậm một chút cho rõ (0.9)
  
  // Cố gắng tìm giọng Google xịn nhất trên trình duyệt
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.name.includes("Google US English")) || voices.find(v => v.lang === 'en-US');
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
};