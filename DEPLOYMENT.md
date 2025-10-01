# VoText Deployment Guide

Complete deployment guide for VoText application.

## 📋 Prerequisites

- Node.js 18+
- FFmpeg (backend)
- Groq API Key
- Netlify account
- Windows VDS (backend) or any server

---

## 🎨 Frontend Deployment (Netlify)

### Method 1: Netlify CLI (Recommended)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Build
npm run build

# Deploy to production
netlify deploy --prod

# Follow prompts and select:
# - Publish directory: dist
```

### Method 2: Git Integration

1. Push code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Base directory:** `frontend`

6. Add environment variables:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.com` (your backend URL)

7. Click "Deploy site"

### Method 3: Manual Deploy

```bash
cd frontend
npm install
npm run build

# Drag and drop the 'dist' folder to Netlify dashboard
```

### Environment Variables (Netlify)

Go to Site settings > Build & deploy > Environment variables:

```
VITE_API_URL=https://api.votext.app
```

Or use your backend URL (VDS IP, ngrok, etc.)

### Custom Domain (votext.app)

1. Go to Domain settings in Netlify
2. Click "Add custom domain"
3. Enter: `votext.app`
4. Configure DNS:
   ```
   A Record: @ -> 75.2.60.5
   CNAME: www -> your-site.netlify.app
   ```

---

## 🖥️ Backend Deployment (Windows VDS)

### 1. Server Setup

```bash
# Update system
# Install Node.js 18+ from nodejs.org

# Install FFmpeg
# Download from: https://ffmpeg.org/download.html#build-windows
# Extract to C:\ffmpeg
# Add to PATH: C:\ffmpeg\bin

# Verify installations
node -v
npm -v
ffmpeg -version
```

### 2. Clone and Install

```bash
# Clone repository
git clone https://github.com/bilal07karadeniz/votext.git
cd votext/backend

# Install dependencies
npm install
```

### 3. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env
notepad .env
```

```env
GROQ_API_KEY=your_actual_groq_api_key
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,https://votext.app,https://www.votext.app
```

Get Groq API Key: https://console.groq.com/keys

### 4. PM2 Setup (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name "votext-backend"

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup

# Copy the command shown and run it
# Example: pm2 startup windows

# Verify
pm2 status
pm2 logs votext-backend
```

### 5. Windows Firewall

```bash
# Allow port 3000
netsh advfirewall firewall add rule name="VoText Backend" dir=in action=allow protocol=TCP localport=3000
```

### 6. ngrok (Optional - for external access)

```bash
# Download ngrok from https://ngrok.com
# Extract and run:
ngrok http 3000

# Copy the HTTPS URL and use it as VITE_API_URL in frontend
```

### 7. PM2 Commands

```bash
# View logs
pm2 logs votext-backend

# Restart
pm2 restart votext-backend

# Stop
pm2 stop votext-backend

# Delete
pm2 delete votext-backend

# Monitor
pm2 monit

# View all processes
pm2 list
```

---

## 🔄 Update Deployment

### Frontend Update

```bash
cd frontend
git pull
npm install
npm run build
netlify deploy --prod
```

### Backend Update

```bash
cd backend
git pull
npm install
pm2 restart votext-backend
pm2 logs votext-backend
```

---

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

### Backend
```bash
cd backend
npm start
# Test: http://localhost:3000/api/health
```

### Full Stack Test
1. Start backend: `npm start` (port 3000)
2. Start frontend: `npm run dev` (port 5173)
3. Record audio or upload file
4. Verify PDF download

---

## 🐛 Troubleshooting

### Frontend Issues

**404 on assets:**
- Check `vite.config.js` base path is `/`
- Verify `dist` folder exists after build
- Check Netlify publish directory is `dist`

**API connection failed:**
- Verify `VITE_API_URL` in Netlify environment variables
- Check CORS settings in backend
- Verify backend is running

### Backend Issues

**FFmpeg not found:**
```bash
# Check PATH
echo %PATH%
ffmpeg -version

# Re-add to PATH if needed
setx PATH "%PATH%;C:\ffmpeg\bin"
# Restart terminal
```

**Port 3000 already in use:**
```bash
# Find process
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F

# Or change PORT in .env
```

**PM2 not starting on boot:**
```bash
pm2 unstartup
pm2 startup
pm2 save
```

---

## 📊 Monitoring

### Netlify
- Dashboard: https://app.netlify.com
- Analytics, Deploy logs, Error tracking

### Backend (PM2)
```bash
# Real-time monitoring
pm2 monit

# Logs
pm2 logs votext-backend --lines 100

# Error logs only
pm2 logs votext-backend --err
```

---

## 🔒 Security

### Frontend
- ✅ HTTPS enforced (Netlify)
- ✅ CSP headers in netlify.toml
- ✅ No sensitive data in frontend

### Backend
- ✅ CORS whitelist specific domains
- ✅ Never commit .env file
- ✅ Rate limiting (add if needed)
- ✅ Input validation

---

## 📈 Performance

### Frontend Optimizations
- ✅ Vite code splitting
- ✅ Asset caching (31536000s)
- ✅ Service Worker (PWA)
- ✅ Lazy loading

### Backend Optimizations
- ✅ FFmpeg codec copy (fast splitting)
- ✅ Streaming responses
- ✅ File cleanup after processing

---

## 📝 Checklist

### Before Deploy

- [ ] Test locally (frontend + backend)
- [ ] Update .env files
- [ ] Commit and push to Git
- [ ] Build frontend: `npm run build`
- [ ] Test build: `npm run preview`

### Frontend Deploy

- [ ] Set VITE_API_URL in Netlify
- [ ] Deploy to Netlify
- [ ] Test deployed site
- [ ] Configure custom domain
- [ ] Enable HTTPS

### Backend Deploy

- [ ] FFmpeg installed and in PATH
- [ ] .env file configured
- [ ] PM2 installed
- [ ] App started with PM2
- [ ] PM2 startup configured
- [ ] Test API: /api/health
- [ ] Verify CORS settings

---

## 🎉 Success!

Your VoText application should now be live:
- Frontend: https://votext.app
- Backend: http://your-vds-ip:3000 (or ngrok URL)

Test the complete flow:
1. Visit votext.app
2. Record or upload audio
3. Download PDF transcript

---

## 📞 Support

Issues? Check:
1. [Backend README](backend/README.md)
2. [Frontend README](frontend/README.md)
3. PM2 logs: `pm2 logs votext-backend`
4. Netlify deploy logs

---

© 2025 VoText - Made with ❤️ by Bilal Karadeniz
