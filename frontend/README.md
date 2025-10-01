# VoText - Frontend

Professional React + Vite application for voice to text transcription. Modern, responsive design with microphone recording and file upload capabilities.

## Özellikler

- ✅ Mikrofondan canlı ses kaydı (MediaRecorder API)
- ✅ Dosya yükleme (drag-drop desteği)
- ✅ 200MB'a kadar dosya desteği
- ✅ Upload ve işleme sırasında progress tracking
- ✅ Profesyonel, modern ve minimalist tasarım
- ✅ Responsive design (mobil, tablet, desktop)
- ✅ Kullanıcı dostu hata mesajları
- ✅ PDF otomatik indirme
- ✅ Format ve boyut kontrolü

## Gereksinimler

- Node.js 18 veya üzeri
- Backend API çalışır durumda olmalı

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env` dosyası oluşturun:
```bash
cp .env.example .env
```

3. `.env` dosyasını düzenleyin:
```
VITE_API_URL=http://localhost:3000
```

Production için:
```
VITE_API_URL=https://your-backend-api.com
```

## Kullanım

### Development Mode
```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

### Production Build
```bash
npm run build
```

Build dosyaları `dist/` klasörüne oluşturulur.

### Production Preview
```bash
npm run preview
```

## Netlify'a Deployment

### 1. Netlify CLI ile (Önerilen)

Netlify CLI kurulumu:
```bash
npm install -g netlify-cli
```

Netlify'a giriş yapın:
```bash
netlify login
```

İlk deployment:
```bash
npm run build
netlify deploy --prod
```

### 2. Netlify Dashboard ile

1. [Netlify](https://netlify.com) hesabınıza giriş yapın
2. "Add new site" > "Import an existing project"
3. Git repository'nizi bağlayın veya manuel deploy yapın
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

5. Environment variables ekleyin:
   - Key: `VITE_API_URL`
   - Value: Backend API URL'iniz (örn: `http://your-vds-ip:3000` veya ngrok URL)

### 3. Git Push ile Otomatik Deploy

`netlify.toml` dosyası oluşturun:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Git'e push yaptığınızda otomatik deploy olur:
```bash
git add .
git commit -m "Deploy to Netlify"
git push
```

## Özellikler ve Kullanım

### Mikrofon ile Kayıt

1. "Kaydı Başlat" butonuna tıklayın
2. Tarayıcı mikrofon izni isteyecektir, izin verin
3. Konuşmaya başlayın (canlı süre gösterilir)
4. "Kaydı Durdur" ile kaydı sonlandırın
5. "Metne Çevir" ile transkripsiyon başlatın

### Dosya Yükleme

**Yöntem 1: Drag & Drop**
- Ses dosyanızı sürükleyip yükleme alanına bırakın

**Yöntem 2: Dosya Seçici**
- "Dosya Seç" butonuna tıklayın
- Bilgisayarınızdan ses dosyasını seçin

**Desteklenen Formatlar:**
- MP3
- WAV
- M4A
- WebM
- OGG

**Maksimum Dosya Boyutu:** 200MB (24MB'den büyük dosyalar backend'de otomatik bölünür)

### İşleme Süreci

1. Dosya backend'e yüklenir (%0-50)
2. Groq API ile transkripsiyon yapılır
3. PDF oluşturulur ve indirilir (%50-100)
4. PDF otomatik olarak indirilir

## Hata Yönetimi

### "Sunucuya bağlanılamadı" hatası:
- Backend servisinin çalıştığından emin olun
- `.env` dosyasındaki `VITE_API_URL`'yi kontrol edin
- CORS ayarlarını kontrol edin

### "Mikrofona erişilemedi" hatası:
- Tarayıcı mikrofon iznini kontrol edin
- HTTPS kullanın (HTTP'de mikrofon çalışmayabilir)
- Başka bir uygulama mikrofonu kullanıyor olabilir

### "Dosya çok büyük" hatası:
- Maksimum dosya boyutu 200MB'dır
- Daha büyük dosyalar için ses dosyasını bölün

### "Desteklenmeyen format" hatası:
- Sadece MP3, WAV, M4A, WebM, OGG formatları desteklenmektedir
- Dosya uzantısını kontrol edin

## Klasör Yapısı

```
frontend/
├── src/
│   ├── components/
│   │   ├── AudioRecorder.jsx    # Mikrofon kaydı bileşeni
│   │   └── FileUploader.jsx     # Dosya yükleme bileşeni
│   ├── App.jsx                  # Ana uygulama
│   ├── App.css                  # Ana stiller
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global stiller
├── public/                      # Statik dosyalar
├── index.html                   # HTML template
├── vite.config.js              # Vite konfigürasyonu
├── package.json                # Bağımlılıklar
├── .env                        # Environment variables (git'e eklemeyin!)
└── .env.example                # Environment variables örneği
```

## Tarayıcı Desteği

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**Not:** Mikrofon kaydı için tarayıcının MediaRecorder API'sini desteklemesi gerekir.

## Performans İpuçları

- Production build'de dosya boyutu optimize edilir
- Lazy loading ve code splitting otomatik yapılır
- Images ve assets otomatik optimize edilir

## Güvenlik

- `.env` dosyasını Git'e eklemeyin
- Sadece güvenilir backend URL'leri kullanın
- HTTPS kullanımı önerilir (mikrofon erişimi için gerekli)

## Özelleştirme

### Renkleri Değiştirme

`src/App.css` dosyasında:
```css
/* Ana gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Buton renkleri */
.btn-primary {
  background: #667eea;
}
```

### Logo Değiştirme

`src/App.jsx` dosyasında logo SVG'sini düzenleyin veya resim ekleyin.

## Sorun Giderme

### Build hatası alıyorum:
```bash
# Node modules'ı temizle
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Dev server başlamıyor:
```bash
# Port 5173 kullanımda olabilir
# vite.config.js'de farklı port belirleyin
server: {
  port: 3001,
}
```

## Lisans

MIT

## Geliştirici

**Bilal Karadeniz**
- GitHub: [@bilal07karadeniz](https://github.com/bilal07karadeniz)
- Website: [votext.app](https://votext.app)

---

© 2025 VoText - Made with ❤️ by Bilal Karadeniz
