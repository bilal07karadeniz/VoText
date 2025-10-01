import { useState, useRef } from 'react';

function FileUploader({ onTranscribe, disabled }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB
  const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/x-m4a'];
  const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg'];

  const validateFile = (file) => {
    setError('');

    if (!file) {
      return false;
    }

    // Dosya boyutu kontrolü
    if (file.size > MAX_FILE_SIZE) {
      setError('Dosya çok büyük! Maksimum dosya boyutu 250MB\'dir.');
      return false;
    }

    // Dosya tipi kontrolü
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      setError('Desteklenmeyen dosya formatı! Lütfen MP3, WAV, M4A, WebM veya OGG formatında dosya yükleyin.');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setError('');
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTranscribe = () => {
    if (selectedFile) {
      onTranscribe(selectedFile);
      handleReset();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <div className="card-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16H15V10H19L12 3L5 10H9V16ZM5 18H19V20H5V18Z" fill="currentColor"/>
        </svg>
      </div>

      <h2>Dosya Yükle</h2>
      <p className="card-description">Hazır ses dosyanızı yükleyin</p>

      {error && <div className="error-message">{error}</div>}

      <div
        className={`dropzone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!selectedFile ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.webm,.ogg,audio/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {!selectedFile ? (
          <>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16H15V10H19L12 3L5 10H9V16ZM5 18H19V20H5V18Z" fill="currentColor" opacity="0.4"/>
            </svg>
            <p className="dropzone-text">
              Dosyayı buraya sürükleyin veya <span className="dropzone-link">tıklayın</span>
            </p>
            <p className="dropzone-hint">MP3, WAV, M4A, WebM, OGG (Maks. 250MB)</p>
          </>
        ) : (
          <div className="file-info">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
              <path d="M8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.01L12.01 11L8 15.01Z" fill="currentColor"/>
            </svg>
            <div className="file-details">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="button-group">
        {!selectedFile ? (
          <button
            className="btn btn-primary"
            onClick={handleBrowseClick}
            disabled={disabled}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
            </svg>
            Dosya Seç
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary"
              onClick={handleTranscribe}
              disabled={disabled}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
              </svg>
              Metne Çevir
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={disabled}
            >
              Değiştir
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default FileUploader;
