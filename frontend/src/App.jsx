import { useState, useEffect } from 'react';
import AudioRecorder from './components/AudioRecorder';
import FileUploader from './components/FileUploader';
import './App.css';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState(''); // 'uploading' or 'processing'
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [quotaMinutes, setQuotaMinutes] = useState(null);

  // Quota bilgisini çek
  const fetchQuota = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/quota`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        console.warn('Quota endpoint hatası:', response.status);
        return;
      }

      const data = await response.json();
      setQuotaMinutes(data.remainingMinutes);
    } catch (err) {
      console.error('Quota bilgisi alınamadı:', err);
      // Hata durumunda sessizce geç, quota gösterme
    }
  };

  // Sayfa yüklendiğinde ve her işlem sonrası quota'yı güncelle
  useEffect(() => {
    fetchQuota();
    const interval = setInterval(fetchQuota, 60000); // Her dakika güncelle
    return () => clearInterval(interval);
  }, []);

  const handleTranscribe = async (audioFile) => {
    setIsProcessing(true);
    setProgress(0);
    setProcessingStage('uploading');
    setError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      // XMLHttpRequest kullanarak progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
          setProcessingStage('uploading');
        }
      });

      xhr.upload.addEventListener('load', () => {
        setProgress(0);
        setProcessingStage('processing');
      });

      xhr.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      });

      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', `${apiUrl}/api/transcribe`);
        xhr.responseType = 'blob';

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            xhr.response.text().then(text => {
              try {
                const errorData = JSON.parse(text);
                reject(new Error(errorData.error || 'Bir hata oluştu'));
              } catch {
                reject(new Error('Bir hata oluştu'));
              }
            });
          }
        };

        xhr.onerror = () => reject(new Error('Sunucuya bağlanılamadı. Lütfen backend servisinin çalıştığından emin olun.'));
        xhr.send(formData);
      });

      setProgress(100);

      // PDF'i indir - dosya adını kullan
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;

      // Dosya adını oluştur
      const originalName = audioFile.name.replace(/\.[^/.]+$/, ''); // Uzantıyı kaldır
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      a.download = `${originalName}-votext-${timestamp}.pdf`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage('✅ Transkript başarıyla oluşturuldu ve indirildi!');

      // Quota'yı güncelle
      fetchQuota();

    } catch (err) {
      console.error('Hata:', err);
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <img src="/logo.png" alt="VoText Logo" className="logo-image" />
            <div className="logo-text">
              <h1>VoText</h1>
              <p className="tagline">Ses Yazıya, Anında</p>
            </div>
          </div>
          <p className="subtitle">Yapay zeka destekli profesyonel Türkçe transkripsiyon hizmeti</p>
          {quotaMinutes !== null && (
            <div className="quota-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
              <span>Şu anda maksimum {quotaMinutes} dakikalık ses işlenebilir</span>
            </div>
          )}
        </div>
      </header>

      <main className="main">
        <div className="container">
          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
              </svg>
              {successMessage}
            </div>
          )}

          <div className="cards">
            <AudioRecorder
              onTranscribe={handleTranscribe}
              disabled={isProcessing}
            />

            <FileUploader
              onTranscribe={handleTranscribe}
              disabled={isProcessing}
            />
          </div>

          {isProcessing && (
            <div className="progress-container">
              <div className="progress-header">
                {processingStage === 'uploading' && (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" fill="currentColor"/>
                    </svg>
                    <span>Dosya yükleniyor...</span>
                  </>
                )}
                {processingStage === 'processing' && (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="processing-icon">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                    </svg>
                    <span>Metne dönüştürülüyor...</span>
                  </>
                )}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">
                {processingStage === 'uploading' ? `Yükleniyor: ${progress}%` :
                 processingStage === 'processing' ? 'Yapay zeka ile işleniyor...' :
                 `${progress}%`}
              </p>
            </div>
          )}

          <div className="info-section">
            <h2>Nasıl Çalışır?</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Kaydet veya Yükle</h3>
                  <p>Mikrofondan kayıt yapın veya hazır ses dosyanızı yükleyin</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Yapay Zeka İşleme</h3>
                  <p>Gelişmiş yapay zeka teknolojisi ile sesiniz yüksek doğrulukla metne dönüştürülür</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>PDF İndir</h3>
                  <p>Transkriptinizi anında profesyonel PDF belgesi olarak alın</p>
                </div>
              </div>
            </div>

            <div className="features">
              <h3>Özellikler</h3>
              <div className="features-grid">
                <div className="feature-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                  </svg>
                  <span>Yüksek kaliteli Türkçe transkripsiyon</span>
                </div>
                <div className="feature-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                  </svg>
                  <span>200MB'a kadar dosya desteği</span>
                </div>
                <div className="feature-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                  </svg>
                  <span>Çoklu ses formatı desteği</span>
                </div>
                <div className="feature-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                  </svg>
                  <span>Profesyonel PDF çıktısı</span>
                </div>
                <div className="feature-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                  </svg>
                  <span>Otomatik dosya bölme (23MB+)</span>
                </div>
                <div className="feature-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                  </svg>
                  <span>Hızlı ve güvenilir işleme</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 VoText - Made with ❤️ by <a href="https://github.com/bilal07karadeniz" target="_blank" rel="noopener noreferrer">Bilal Karadeniz</a></p>
          <p className="footer-links">
            <a href="https://votext.app" target="_blank" rel="noopener noreferrer">votext.app</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
