
export const playSmartAudio = (text) => {
  if (!text) return;

  // 1. Hủy giọng đang đọc dở (nếu người dùng bấm liên tục)
  window.speechSynthesis.cancel();

  // 2. Tạo đối tượng phát âm
  const utterance = new SpeechSynthesisUtterance(text);
  
  // 3. Lấy danh sách giọng đọc có sẵn trên máy
  let voices = window.speechSynthesis.getVoices();

  // Mẹo: Đôi khi trình duyệt chưa load kịp giọng, thử load lại
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      setBestVoice(utterance, voices);
      window.speechSynthesis.speak(utterance);
    };
    return; // Đợi sự kiện kích hoạt
  }

  // 4. Chọn giọng tốt nhất (Ưu tiên giọng Mỹ tự nhiên)
  setBestVoice(utterance, voices);

  // 5. Tinh chỉnh tốc độ (0.9 là tốc độ vàng để học tiếng Anh)
  utterance.rate = 0.9; 
  utterance.pitch = 1;

  // 6. Đọc
  window.speechSynthesis.speak(utterance);
};


function setBestVoice(utterance, voices) {
  // Danh sách ưu tiên (Theo kinh nghiệm: Google > Microsoft > Apple)
  const preferredVoices = [
    "Google US English",      // Chrome (Rất hay)
    "Microsoft Zira",         // Windows (Khá)
    "Samantha",               // macOS (Khá)
    "English United States"   // Mặc định
  ];

  let selectedVoice = null;

  // Tìm giọng phù hợp nhất trong danh sách ưu tiên
  for (const pref of preferredVoices) {
    selectedVoice = voices.find(v => v.name.includes(pref));
    if (selectedVoice) break;
  }

  // Nếu không tìm thấy giọng ưu tiên, lấy giọng tiếng Anh bất kỳ
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith('en-US'));
  }

  // Gán giọng đã chọn
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log("🎤 Đang đọc bằng giọng:", selectedVoice.name);
  }
}