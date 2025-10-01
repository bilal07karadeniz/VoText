# VoText - Backend

Node.js + Express backend service for voice to text transcription. Uses Groq API (Whisper Large-v3 Turbo) to convert Turkish audio files to text and generate PDFs.

## Özellikler

- ✅ Groq Whisper Large-v3 Turbo modeli ile yüksek kaliteli Türkçe transkripsiyon
- ✅ 200MB'a kadar ses dosyası desteği
- ✅ 24MB'den büyük dosyalar için FFmpeg ile otomatik zaman bazlı bölme
- ✅ PDF oluşturma (başlık, tarih, süre bilgisi dahil)
- ✅ Türkçe karakter desteği
- ✅ Desteklenen formatlar: MP3, WAV, M4A, WebM, OGG
- ✅ CORS desteği
- ✅ Hata yönetimi ve kullanıcı dostu mesajlar

## Gereksinimler

- Node.js 18 veya üzeri
- FFmpeg ([https://ffmpeg.org/download.html](https://ffmpeg.org/download.html) - ses dosyası bölme için)
- Groq API Key ([https://console.groq.com/keys](https://console.groq.com/keys) adresinden ücretsiz alabilirsiniz)

## Kurulum

### 1. FFmpeg Kurulumu

**Windows:**
- [FFmpeg indir](https://ffmpeg.org/download.html#build-windows)
- Zip dosyasını çıkartın (örn: `C:\ffmpeg`)
- System Path'e ekleyin: `C:\ffmpeg\bin`
- Kontrol edin: `ffmpeg -version`

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

### 2. Node.js Bağımlılıkları

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env` dosyası oluşturun:
```bash
cp .env.example .env
```

3. `.env` dosyasını düzenleyin ve Groq API Key'inizi ekleyin:
```
GROQ_API_KEY=your_actual_groq_api_key
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,https://sesdonusturucu.netlify.app
```

4. Türkçe karakter desteği için font dosyası (isteğe bağlı):
   - DejaVuSans.ttf fontunu indirin
   - `backend/fonts/` klasörüne yerleştirin
   - Font yoksa sistem fontu kullanılacaktır

## Kullanım

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server `http://localhost:3000` adresinde çalışmaya başlar.

## API Endpoints

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Türkçe Ses-Yazı Dönüştürücü API çalışıyor",
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

### Transkripsiyon
```
POST /api/transcribe
Content-Type: multipart/form-data
```

**Parameters:**
- `audio` (file): Ses dosyası (MP3, WAV, M4A, WebM, OGG)

**Response:**
- Success: PDF dosyası (application/pdf)
- Error: JSON error mesajı

**Örnek curl komutu:**
```bash
curl -X POST http://localhost:3000/api/transcribe \
  -F "audio=@/path/to/your/audio.mp3" \
  --output transkript.pdf
```

## Windows VDS'te Deployment

### 1. PM2 ile Otomatik Başlatma (Önerilen)

PM2 kurulumu:
```bash
npm install -g pm2
```

Uygulamayı başlat:
```bash
pm2 start server.js --name "ses-donusturucu"
```

Sistem başlangıcında otomatik başlat:
```bash
pm2 startup
pm2 save
```

PM2 komutları:
```bash
pm2 status           # Durum kontrolü
pm2 logs             # Log'ları görüntüle
pm2 restart all      # Yeniden başlat
pm2 stop all         # Durdur
```

### 2. Windows Task Scheduler ile Otomatik Başlatma

1. `start-server.bat` dosyası oluşturun:
```batch
@echo off
cd C:\path\to\backend
node server.js
```

2. Task Scheduler'ı açın (Windows + R > `taskschd.msc`)
3. "Create Basic Task" seçin
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `C:\path\to\start-server.bat`

### 3. ngrok ile Dış Erişim (Opsiyonel)

ngrok kurulumu: [https://ngrok.com/download](https://ngrok.com/download)

Başlatma:
```bash
ngrok http 3000
```

ngrok'un verdiği HTTPS URL'sini frontend .env dosyasına ekleyin.

## Hata Ayıklama

### "Groq API hatası" alıyorsanız:
- GROQ_API_KEY doğru girilmiş mi kontrol edin
- API key'inizin geçerli olduğundan emin olun
- İnternet bağlantınızı kontrol edin

### "Dosya çok büyük" hatası:
- Maksimum dosya boyutu 200MB'dır
- 24MB'den büyük dosyalar otomatik olarak bölünür (FFmpeg gerekli)

### "FFmpeg bulunamadı" hatası:
- FFmpeg'in kurulu ve PATH'e eklenmiş olduğundan emin olun
- Komut satırında `ffmpeg -version` çalıştırarak test edin
- Windows'ta sistem PATH'ini güncelledikten sonra cmd'yi yeniden başlatın

### "Desteklenmeyen dosya formatı" hatası:
- Sadece MP3, WAV, M4A, WebM, OGG formatları desteklenmektedir
- Dosya uzantısını kontrol edin

### PDF'de Türkçe karakterler görünmüyorsa:
- `backend/fonts/` klasörüne DejaVuSans.ttf fontunu ekleyin
- Sunucuyu yeniden başlatın

## Klasör Yapısı

```
backend/
├── server.js           # Ana server dosyası
├── package.json        # Bağımlılıklar
├── .env               # Environment variables (git'e eklemeyin!)
├── .env.example       # Environment variables örneği
├── fonts/             # PDF için font dosyaları
│   └── DejaVuSans.ttf
└── uploads/           # Geçici dosyalar (otomatik oluşur)
```

## Güvenlik Notları

- `.env` dosyasını asla Git'e eklemeyin
- Production'da `ALLOWED_ORIGINS` değişkenini spesifik domainlere ayarlayın
- HTTPS kullanımı önerilir
- API rate limiting eklemek isteyebilirsiniz

## Performans

- Whisper Large-v3 Turbo modeli kullanılır (hızlı ve doğru)
- 5 dakikalık bir ses dosyası ~10-15 saniyede transkribe edilir
- Chunk'lama sayesinde 200MB'a kadar dosya işlenebilir

## Lisans

MIT

## Geliştirici

**Bilal Karadeniz**
- GitHub: [@bilal07karadeniz](https://github.com/bilal07karadeniz)
- Website: [votext.app](https://votext.app)

---

© 2025 VoText - Made with ❤️ by Bilal Karadeniz
