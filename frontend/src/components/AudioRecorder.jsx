import { useState, useRef, useEffect } from 'react';

function AudioRecorder({ onTranscribe, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Timer için useEffect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);

        // Stream'i kapat
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Mikrofon erişim hatası:', err);
      setError('Mikrofona erişilemedi. Lütfen tarayıcı izinlerini kontrol edin.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPaused(false);
    chunksRef.current = [];
    setError('');
  };

  const handleTranscribe = () => {
    if (audioBlob) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const file = new File([audioBlob], `recording-${timestamp}.webm`, { type: 'audio/webm' });
      onTranscribe(file);
      resetRecording();
    }
  };

  return (
    <div className="card">
      <div className="card-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" fill="currentColor"/>
          <path d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z" fill="currentColor"/>
        </svg>
      </div>

      <h2>Mikrofonla Kaydet</h2>
      <p className="card-description">Mikrofonunuzdan ses kaydı yapın</p>

      {error && <div className="error-message">{error}</div>}

      <div className="recording-display">
        {isRecording && (
          <div className="recording-indicator">
            <span className={`recording-dot ${isPaused ? 'paused' : ''}`}></span>
            <span>{isPaused ? 'Duraklatıldı' : 'Kayıt Ediliyor'}</span>
          </div>
        )}

        {(isRecording || audioBlob) && (
          <div className="recording-time">
            {formatTime(recordingTime)}
          </div>
        )}
      </div>

      <div className="button-group">
        {!isRecording && !audioBlob && (
          <button
            className="btn btn-primary"
            onClick={startRecording}
            disabled={disabled}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="currentColor"/>
            </svg>
            Kaydı Başlat
          </button>
        )}

        {isRecording && !isPaused && (
          <>
            <button
              className="btn btn-secondary"
              onClick={pauseRecording}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/>
              </svg>
              Duraklat
            </button>
            <button
              className="btn btn-danger"
              onClick={stopRecording}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
              </svg>
              Durdur
            </button>
          </>
        )}

        {isRecording && isPaused && (
          <>
            <button
              className="btn btn-primary"
              onClick={resumeRecording}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
              Devam Et
            </button>
            <button
              className="btn btn-danger"
              onClick={stopRecording}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
              </svg>
              Durdur
            </button>
          </>
        )}

        {audioBlob && !isRecording && (
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
              onClick={resetRecording}
              disabled={disabled}
            >
              Sıfırla
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AudioRecorder;
