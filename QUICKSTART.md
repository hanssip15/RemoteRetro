# 🚀 Quick Start Guide - RetroSprint

Panduan cepat untuk menjalankan project RetroSprint yang sudah direfactor.

## ⚡ Quick Setup (5 Menit)

### 1. Prerequisites Check
```bash
# Pastikan Node.js terinstall
node --version  # Harus 18+

# Pastikan npm terinstall
npm --version
```

### 2. Clone & Install
```bash
# Clone repository (jika belum)
git clone <repository-url>
cd refactor

# Install semua dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### 3. Database Setup
```bash
# Buat database PostgreSQL
# Buka psql atau pgAdmin dan jalankan:
CREATE DATABASE retrosprint;

# Setup environment variables
# Buat file backend/.env dengan isi:
DATABASE_URL=postgresql://username:password@localhost:5432/retrosprint
PORT=3000
NODE_ENV=development
```

### 4. Run Project
```bash
# Option 1: Menggunakan script batch (Windows)
start.bat

# Option 2: Manual
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## 🎯 Test Features

1. **Dashboard**: Lihat daftar retrospectives
2. **Create Retro**: Buat retrospective baru
3. **Join Retro**: Join retrospective yang ada
4. **Add Items**: Tambahkan feedback items
5. **Vote**: Vote untuk items

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Pastikan PostgreSQL running
# Check connection string di backend/.env
# Test connection:
psql postgresql://username:password@localhost:5432/retrosprint
```

### Port Already in Use
```bash
# Check port yang digunakan
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Kill process jika perlu
taskkill /PID <process-id> /F
```

### Dependencies Issues
```bash
# Clear cache dan reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📁 Project Structure

```
refactor/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── app/      # Pages
│   │   ├── components/ # UI Components
│   │   └── services/  # API Calls
│   └── package.json
├── backend/           # NestJS
│   ├── src/
│   │   ├── controllers/ # API Endpoints
│   │   ├── services/    # Business Logic
│   │   └── entities/    # Database Models
│   └── package.json
└── README.md
```

## 🚀 Development Workflow

### Backend Development
```bash
cd backend
npm run start:dev  # Auto-reload saat ada perubahan
```

### Frontend Development
```bash
cd frontend
npm run dev  # Hot reload saat ada perubahan
```

### Database Changes
```bash
# Update entities di backend/src/entities/
# Restart backend untuk apply changes
```

## 📚 API Testing

### Test dengan curl
```bash
# Get all retros
curl http://localhost:3000/api/retros

# Create new retro
curl -X POST http://localhost:3000/api/retros \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Retro","duration":30}'

# Get specific retro
curl http://localhost:3000/api/retros/1
```

### Test dengan Postman
- Import collection dari `docs/postman-collection.json`
- Set base URL: `http://localhost:3000/api`

## 🎨 Customization

### Change Ports
```bash
# Backend port (backend/.env)
PORT=3001

# Frontend port (frontend/vite.config.ts)
server: { port: 3001 }
```

### Change Database
```bash
# Update DATABASE_URL di backend/.env
DATABASE_URL=postgresql://user:pass@host:port/db
```

## 📝 Common Commands

```bash
# Start development
npm run dev

# Build for production
cd frontend && npm run build
cd backend && npm run build

# Run tests
cd backend && npm run test
cd frontend && npm run test

# Database operations
cd backend && npm run db:init
```

## 🆘 Need Help?

1. **Check logs**: Lihat console output untuk error messages
2. **Database**: Pastikan PostgreSQL running dan connection string benar
3. **Ports**: Pastikan port 3000 dan 5173 tidak digunakan aplikasi lain
4. **Dependencies**: Reinstall dependencies jika ada masalah

## 📞 Support

- **Issues**: Buat issue di GitHub repository
- **Documentation**: Lihat README.md untuk detail lengkap
- **API Docs**: http://localhost:3000/api (saat backend running) 