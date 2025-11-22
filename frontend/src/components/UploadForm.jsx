import { useState, useRef } from 'react';
import { UploadCloud, Loader2, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadFileNote } from '../api/deckApi';

const UploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // State xử lý hiệu ứng kéo thả

  const fileInputRef = useRef(null);

  // Xử lý khi chọn file qua dialog
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  // Xử lý Kéo & Thả (Drag & Drop)
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus(null);
    }
  };

  // Xóa file đã chọn
  const removeFile = (e) => {
    e.stopPropagation(); // Ngăn không cho kích hoạt click chọn file lại
    setFile(null);
    setStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e) => {
    e.stopPropagation();
    if (!file) {
      setStatus({ type: 'error', msg: 'Vui lòng thả file vào hoặc bấm để chọn!' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await uploadFileNote(file);
      setStatus({ type: 'success', msg: 'Upload successfully. AI is on the way....' });
      setTimeout(() => {
        if (onUploadSuccess) onUploadSuccess(data.deck_id);
      }, 1500);
    } catch (error) {
      setStatus({ type: 'error', msg: 'Lỗi kết nối server.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-card">
      
      {/* VÙNG KÉO THẢ (DROP ZONE) */}
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          style={{ display: 'none' }} // Ẩn input xấu xí đi
          accept=".txt,.pdf,.docx"
        />

        {!file ? (
          // Giao diện khi chưa có file
          <div className="drop-content">
            <div className="icon-wrapper">
              <UploadCloud size={48} />
            </div>
            <h3>UPDDATE YOUR NOTES HERE</h3>
            <p>DRAG AND DROP FILES HERE <strong>.txt , .pdf , .docx</strong> OR CLICK TO SELECT</p>
          </div>
        ) : (
          // Giao diện khi ĐÃ chọn file
          <div className="file-preview">
            <div className="file-icon">
              <FileText size={32} />
            </div>
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
            </div>
            <button className="btn-remove" onClick={removeFile}>
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      {/* NÚT UPLOAD */}
      <button 
        className={`btn-upload ${isLoading ? 'loading' : ''}`} 
        onClick={handleUpload} 
        disabled={isLoading || !file}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : 'Bắt đầu học ngay 🚀'}
      </button>

      {/* THÔNG BÁO */}
      {status && (
        <div className={`status-msg ${status.type}`}>
          {status.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
          {status.msg}
        </div>
      )}
    </div>
  );
};

export default UploadForm;