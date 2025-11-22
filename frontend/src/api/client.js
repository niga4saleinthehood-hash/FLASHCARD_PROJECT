import axios from 'axios';

// Kiểm tra xem web đang chạy ở môi trường nào
// import.meta.env.PROD sẽ trả về TRUE nếu đang chạy trên Vercel (đã build)
const isProduction = import.meta.env.PROD;

// CẤU HÌNH CỨNG (Hardcode) ĐỂ TRÁNH LỖI BIẾN MÔI TRƯỜNG
const baseURL = isProduction 
  ? 'https://api-flashcard-ai.onrender.com/api'  // 👈 Link Render của bạn (Đảm bảo đúng nhé)
  : 'http://127.0.0.1:8000/api';                 // Link máy nhà

console.log("🌍 Môi trường:", isProduction ? "Production (Trên mạng)" : "Development (Máy nhà)");
console.log("🔗 API đang gọi tới:", baseURL);

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;