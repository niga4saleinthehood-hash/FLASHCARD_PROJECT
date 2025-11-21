import apiClient from './client';

export const uploadFileNote = async (file) => {
  // Khi gửi file, bắt buộc phải dùng FormData
  const formData = new FormData();
  formData.append('file', file); 

  try {
    const response = await apiClient.post('/upload-notes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Báo cho server biết đây là file
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi upload:", error);
    throw error;
  }
};

export const getDeck = async (deckId) => {
  try {
    const response = await apiClient.get(`/decks/${deckId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy deck:", error);
    throw error;
  }
};