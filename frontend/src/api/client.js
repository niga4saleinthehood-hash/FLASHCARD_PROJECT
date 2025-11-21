import axios from 'axios';

// Tạo một "người đưa thư" chuyên dụng
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Địa chỉ nhà Backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;