# 🎤 VoText - Voice to Text Transcription

Professional Turkish voice to text transcription service powered by AI. Convert your audio files to text instantly with Groq Whisper Large-v3 Turbo and download as PDF.

**Live Demo:** [https://votext.app](https://votext.app)

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Deployment](#deployment)
- [Proje Yapısı](#proje-yapısı)
- [Ekran Görüntüleri](#ekran-görüntüleri)
- [Geliştirici](#geliştirici)

## ✨ Özellikler

### Frontend
- 🎙️ Mikrofondan canlı ses kaydı (MediaRecorder API)
- 📁 Dosya yükleme (drag-drop desteği)
- 📊 Upload ve işleme sırasında progress tracking
- 🎨 Profesyonel, modern ve minimalist tasarım
- 📱 Responsive design (mobil, tablet, desktop)
- ⚠️ Kullanıcı dostu hata mesajları
- 📄 PDF otomatik indirme

### Backend
- 🤖 Groq Whisper Large-v3 Turbo ile transkripsiyon
- 📦 200MB'a kadar dosya desteği
- ✂️ 24MB'den büyük dosyalar için FFmpeg ile otomatik zaman bazlı bölme
- 📝 Profesyonel PDF oluşturma (Türkçe karakter desteği)
- 🎵 MP3, WAV, M4A, WebM, OGG format desteği
- 🔒 CORS ve güvenlik ayarları

## 🛠️ Teknolojiler

### Frontend
- **React 18** - UI kütüphanesi
- **Vite** - Build tool
- **Modern CSS** - Responsive tasarım

### Backend
- **Node.js + Express** - Server framework
- **Groq SDK** - Whisper API client
- **FFmpeg** - Ses dosyası bölme
- **PDFKit** - PDF oluşturma
- **Multer** - Dosya yükleme

## 📥 Kurulum

### Gereksinimler
- Node.js 18+
- FFmpeg ([indir](https://ffmpeg.org/download.html))
- Groq API Key ([ücretsiz alın](https://console.groq.com/keys))

### 1. Repository'yi Klonlayın
```bash
git clone https://github.com/bilal07karadeniz/votext.git
cd votext
```

### 2. FFmpeg Kurulumu

**Windows:**
- [FFmpeg indir](https://ffmpeg.org/download.html#build-windows)
- Zip'i çıkart ve PATH'e ekle
- Test: `ffmpeg -version`

**Linux:** `sudo apt install ffmpeg`

**macOS:** `brew install ffmpeg`

### 3. Backend Kurulumu
```bash
cd backend
npm install

# .env dosyası oluşturun
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,https://sesdonusturucu.netlify.app
```

Backend'i başlatın:
```bash
npm start
```

Server `http://localhost:3000` adresinde çalışacak.

### 4. Frontend Kurulumu
```bash
cd ../frontend
npm install

# .env dosyası oluşturun
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
VITE_API_URL=http://localhost:3000
```

Frontend'i başlatın:
```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılacak.

## 🚀 Kullanım

### Mikrofon ile Kayıt
1. "Kaydı Başlat" butonuna tıklayın
2. Tarayıcı mikrofon izni isteyecektir
3. Konuşmaya başlayın (canlı süre gösterilir)
4. "Kaydı Durdur" ile sonlandırın
5. "Metne Çevir" ile transkripsiyon başlatın

### Dosya Yükleme
1. Ses dosyanızı sürükleyip bırakın veya "Dosya Seç"
2. "Metne Çevir" ile transkripsiyon başlatın
3. PDF otomatik olarak indirilir

**Desteklenen Formatlar:** MP3, WAV, M4A, WebM, OGG
**Maksimum Boyut:** 200MB

## 🌐 Deployment

### Backend - Windows VDS

#### PM2 ile Otomatik Başlatma (Önerilen)
```bash
# PM2 kurulumu
npm install -g pm2

# Uygulamayı başlat
pm2 start server.js --name "ses-donusturucu"

# Sistem başlangıcında otomatik başlat
pm2 startup
pm2 save
```

#### ngrok ile Dış Erişim (Opsiyonel)
```bash
ngrok http 3000
```

ngrok URL'sini frontend `.env` dosyasına ekleyin.

### Frontend - Netlify

#### 1. Netlify CLI ile
```bash
npm install -g netlify-cli
netlify login

cd frontend
npm run build
netlify deploy --prod
```

#### 2. Netlify Dashboard ile
1. [Netlify](https://netlify.com)'a giriş yapın
2. "Add new site" > Repository'yi bağlayın
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Environment variables:
   - `VITE_API_URL`: Backend URL'iniz

#### 3. Git Push ile Otomatik Deploy
```bash
git add .
git commit -m "Deploy to Netlify"
git push
```

Her push'ta otomatik deploy olur.

## 📁 Proje Yapısı

```
speech-to-text-app/
├── backend/
│   ├── server.js              # Ana server dosyası
│   ├── package.json           # Backend bağımlılıkları
│   ├── .env.example           # Environment variables örneği
│   ├── .gitignore
│   ├── fonts/                 # PDF için Türkçe font
│   └── README.md              # Backend dökümantasyonu
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioRecorder.jsx    # Mikrofon kaydı
│   │   │   └── FileUploader.jsx     # Dosya yükleme
│   │   ├── App.jsx            # Ana uygulama
│   │   ├── App.css            # Stiller
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global stiller
│   ├── public/                # Statik dosyalar
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json           # Frontend bağımlılıkları
│   ├── .env.example
│   ├── .gitignore
│   ├── netlify.toml           # Netlify konfigürasyonu
│   └── README.md              # Frontend dökümantasyonu
│
└── README.md                  # Ana dökümantasyon
```

## 📸 Ekran Görüntüleri

*(Ekran görüntüleri projeniz deploy edildikten sonra eklenebilir)*

## 🔧 API Endpoints

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
- `audio` (file): Ses dosyası

**Response:**
- Success: PDF dosyası
- Error: JSON error mesajı

## 🐛 Sorun Giderme

### Backend bağlantı hatası:
- Backend servisinin çalıştığından emin olun
- `.env` dosyalarını kontrol edin
- CORS ayarlarını kontrol edin

### Mikrofon erişim hatası:
- Tarayıcı mikrofon iznini kontrol edin
- HTTPS kullanın (HTTP'de çalışmayabilir)

### "FFmpeg bulunamadı" hatası:
- FFmpeg'in kurulu ve PATH'e eklenmiş olduğundan emin olun
- Test: `ffmpeg -version`
- Windows'ta PATH güncellemesinden sonra terminal'i yeniden başlatın

### PDF'de Türkçe karakterler görünmüyorsa:
- `backend/fonts/` klasörüne DejaVuSans.ttf fontunu ekleyin
- Font: [DejaVu Fonts](https://dejavu-fonts.github.io/)

## 📝 Lisans

CC BY-NC 4.0 (Creative Commons Attribution-NonCommercial 4.0 International)

Bu proje ticari olmayan kullanım için ücretsizdir. Ticari kullanım için lütfen benimle iletişime geçin.

## 👨‍💻 Geliştirici

**Bilal Karadeniz**
- GitHub: [@bilal07karadeniz](https://github.com/bilal07karadeniz)
- Website: [votext.app](https://votext.app)

---

## 🤝 Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır. Büyük değişiklikler için lütfen önce bir issue açın.

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Branch'e push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## ⭐ Beğendiyseniz

Projeyi beğendiyseniz yıldız ⭐ vermeyi unutmayın!

---

© 2025 VoText - Made with ❤️ by Bilal Karadeniz
