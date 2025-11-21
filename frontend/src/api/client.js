import axios from 'axios';

// Ưu tiên dùng biến môi trường (Vercel), nếu không có thì dùng localhost
const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;