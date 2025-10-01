import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Groq from 'groq-sdk';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';

dotenv.config();

const stat = promisify(fs.stat);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Groq rate limiting tracker (7200 seconds per hour)
const rateLimitTracker = {
  usage: [],
  maxSecondsPerHour: 7200,

  addUsage(seconds) {
    const now = Date.now();
    this.usage.push({ timestamp: now, seconds });
    this.cleanup();
  },

  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.usage = this.usage.filter(u => u.timestamp > oneHourAgo);
  },

  getCurrentUsage() {
    this.cleanup();
    return this.usage.reduce((sum, u) => sum + u.seconds, 0);
  },

  getRemainingSeconds() {
    return this.maxSecondsPerHour - this.getCurrentUsage();
  },

  canProcess(estimatedSeconds) {
    return this.getRemainingSeconds() >= estimatedSeconds;
  }
};

// Groq API client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// CORS ayarları
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

// Uploads klasörünü oluştur
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer ayarları - maksimum 200MB
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/x-m4a'];
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg'];

    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya formatı. Lütfen mp3, wav, m4a, webm veya ogg formatında dosya yükleyin.'));
    }
  }
});

// FFmpeg ile ses dosyasını zaman bazlı chunk'lara böl
async function splitAudioWithFFmpeg(inputPath, maxSizeMB = 23) {
  const chunks = [];
  const fileStats = await stat(inputPath);
  const fileSizeMB = fileStats.size / (1024 * 1024);

  if (fileSizeMB <= maxSizeMB) {
    return [inputPath]; // Bölmeye gerek yok
  }

  return new Promise((resolve, reject) => {
    // Ses dosyasının toplam süresini al
    ffmpeg.ffprobe(inputPath, async (err, metadata) => {
      if (err) {
        console.error('FFprobe hatası:', err);
        return reject(new Error('Ses dosyası bilgileri alınamadı'));
      }

      const duration = metadata.format.duration; // saniye cinsinden
      if (!duration) {
        return reject(new Error('Ses dosyası süresi belirlenemedi'));
      }

      // Her chunk'ın kaç saniye olması gerektiğini hesapla
      const numChunks = Math.ceil(fileSizeMB / maxSizeMB);
      const chunkDuration = Math.ceil(duration / numChunks);

      console.log(`Dosya ${numChunks} parçaya bölünecek (her parça ~${chunkDuration} saniye)`);

      const ext = path.extname(inputPath);
      const promises = [];

      for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDuration;
        const outputPath = inputPath.replace(ext, `_chunk${i}${ext}`);
        chunks.push(outputPath);

        const promise = new Promise((resolveChunk, rejectChunk) => {
          ffmpeg(inputPath)
            .setStartTime(startTime)
            .setDuration(chunkDuration)
            .output(outputPath)
            .audioCodec('copy') // Codec'i kopyala, yeniden encode etme (hızlı)
            .on('end', () => {
              console.log(`Chunk ${i + 1}/${numChunks} oluşturuldu: ${outputPath}`);
              resolveChunk();
            })
            .on('error', (err) => {
              console.error(`Chunk ${i + 1} hatası:`, err);
              rejectChunk(err);
            })
            .run();
        });

        promises.push(promise);
      }

      try {
        await Promise.all(promises);
        resolve(chunks);
      } catch (error) {
        // Hata durumunda oluşturulan chunk'ları temizle
        chunks.forEach(chunkPath => {
          if (fs.existsSync(chunkPath)) {
            fs.unlinkSync(chunkPath);
          }
        });
        reject(error);
      }
    });
  });
}

// Groq API ile transkripsiyon
async function transcribeAudio(filePath) {
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3-turbo',
      language: 'tr',
      response_format: 'json',
      temperature: 0.0,
    });

    return transcription.text || '';
  } catch (error) {
    console.error('Groq API hatası:', error);
    throw new Error(`Transkripsiyon hatası: ${error.message}`);
  }
}

// Ses dosyasının süresini hesapla (FFprobe ile gerçek süre)
async function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        // Fallback: dosya boyutuna göre tahmin
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        const estimatedMinutes = Math.round(fileSizeInMB);
        resolve(estimatedMinutes * 60); // saniye cinsinden
      } else {
        const durationSeconds = metadata.format.duration || 0;
        resolve(Math.round(durationSeconds));
      }
    });
  });
}

// PDF oluştur
function createPDF(text, originalFilename, duration) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Türkçe karakter desteği için font
      const fontPath = path.join(__dirname, 'fonts', 'DejaVuSans.ttf');
      if (fs.existsSync(fontPath)) {
        doc.font(fontPath);
      }

      // Başlık
      doc.fontSize(20)
         .fillColor('#2563eb')
         .text('Ses Transkripti', { align: 'center' });

      doc.moveDown(0.5);

      // Bilgiler
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text(`Dosya: ${originalFilename}`, { align: 'center' });

      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, { align: 'center' });

      if (duration > 0) {
        doc.text(`Tahmini Süre: ${duration} dakika`, { align: 'center' });
      }

      doc.moveDown(2);

      // Ayırıcı çizgi
      doc.strokeColor('#e5e7eb')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke();

      doc.moveDown(1);

      // Transkript metni
      doc.fontSize(11)
         .fillColor('#1f2937')
         .text(text, {
           align: 'left',
           lineGap: 4
         });

      doc.moveDown(3);

      // Footer
      doc.fontSize(9)
         .fillColor('#9ca3af')
         .text('© 2025 Made with ❤️ by Bilal Karadeniz', {
           align: 'center'
         });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Türkçe Ses-Yazı Dönüştürücü API çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// Quota endpoint - kalan süreyi döndür
app.get('/api/quota', (req, res) => {
  const remainingSeconds = rateLimitTracker.getRemainingSeconds();
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const totalMinutes = Math.floor(rateLimitTracker.maxSecondsPerHour / 60);

  res.json({
    remainingSeconds,
    remainingMinutes,
    totalMinutes,
    message: `Şu anda maksimum ${remainingMinutes} dakikalık ses işlenebilir`
  });
});

// Transkripsiyon endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  let filePath = null;
  let chunkPaths = [];

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Ses dosyası bulunamadı. Lütfen bir ses dosyası yükleyin.'
      });
    }

    filePath = req.file.path;
    const originalFilename = req.file.originalname;
    const fileSize = req.file.size;
    const fileSizeMB = fileSize / (1024 * 1024);

    console.log(`Dosya alındı: ${originalFilename} (${fileSizeMB.toFixed(2)} MB)`);

    // Ses dosyasının süresini al
    const audioDurationSeconds = await getAudioDuration(filePath);
    console.log(`Ses süresi: ${audioDurationSeconds} saniye (${(audioDurationSeconds / 60).toFixed(1)} dakika)`);

    // Rate limit kontrolü
    if (!rateLimitTracker.canProcess(audioDurationSeconds)) {
      const remainingSeconds = rateLimitTracker.getRemainingSeconds();
      const waitMinutes = Math.ceil((audioDurationSeconds - remainingSeconds) / 60);

      throw new Error(
        `Groq API saatlik limit aşıldı. ` +
        `Kalan süre: ${Math.floor(remainingSeconds / 60)} dakika. ` +
        `Bu dosyayı işlemek için lütfen ${waitMinutes} dakika sonra tekrar deneyin.`
      );
    }

    let transcriptText = '';

    // 23MB'den büyükse FFmpeg ile böl
    if (fileSizeMB > 23) {
      console.log('Dosya 23MB\'den büyük, FFmpeg ile bölünüyor...');
      chunkPaths = await splitAudioWithFFmpeg(filePath, 23);

      console.log(`Dosya ${chunkPaths.length} parçaya bölündü`);

      // Her chunk'ı transkribe et
      for (let i = 0; i < chunkPaths.length; i++) {
        console.log(`Parça ${i + 1}/${chunkPaths.length} transkribe ediliyor...`);
        const chunkText = await transcribeAudio(chunkPaths[i]);
        transcriptText += chunkText + ' ';
      }
    } else {
      console.log('Dosya transkribe ediliyor...');
      transcriptText = await transcribeAudio(filePath);
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
      throw new Error('Transkripsiyon başarısız oldu. Ses dosyasında konuşma tespit edilemedi.');
    }

    console.log('Transkripsiyon tamamlandı, PDF oluşturuluyor...');

    // Rate limit'e kullanımı ekle
    rateLimitTracker.addUsage(audioDurationSeconds);
    console.log(`Rate limit güncellendi. Kalan: ${Math.floor(rateLimitTracker.getRemainingSeconds() / 60)} dakika`);

    // PDF oluştur
    const pdfBuffer = await createPDF(transcriptText, originalFilename, Math.floor(audioDurationSeconds / 60));

    console.log('PDF oluşturuldu, gönderiliyor...');

    // PDF'i gönder
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="transkript-${Date.now()}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Hata:', error);

    let errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.';
    let statusCode = 500;

    if (error.message.includes('Desteklenmeyen dosya formatı')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('Groq API')) {
      errorMessage = 'Ses dosyası işlenirken bir hata oluştu. Lütfen dosyanızın geçerli bir ses dosyası olduğundan emin olun.';
      statusCode = 422;
    } else if (error.message.includes('konuşma tespit edilemedi')) {
      errorMessage = error.message;
      statusCode = 422;
    }

    res.status(statusCode).json({ error: errorMessage });
  } finally {
    // Geçici dosyaları temizle
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Chunk dosyalarını temizle
    chunkPaths.forEach(chunkPath => {
      if (chunkPath !== filePath && fs.existsSync(chunkPath)) {
        fs.unlinkSync(chunkPath);
      }
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Dosya çok büyük. Maksimum dosya boyutu 200MB\'dir.'
      });
    }
  }

  res.status(500).json({
    error: error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎤 API endpoint: http://localhost:${PORT}/api/transcribe`);
});
