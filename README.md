# RemoteRetro - Refactored Project

RemoteRetro adalah aplikasi retrospective online yang memungkinkan tim untuk melakukan retrospective meeting secara remote. Project ini telah direfactor menjadi struktur frontend dan backend yang terpisah untuk memungkinkan pengembangan yang lebih fleksibel.

## 🏗️ Struktur Project

```
refactor/
├── frontend/          # React + Vite Frontend
│   ├── src/
│   │   ├── app/      # Pages dan routing
│   │   ├── components/ # UI Components
│   │   ├── services/  # API Services
│   │   └── ...
│   └── ...
├── backend/           # NestJS Backend
│   ├── src/
│   │   ├── controllers/ # HTTP Controllers
│   │   ├── services/    # Business Logic
│   │   ├── entities/    # Database Entities
│   │   ├── dto/         # Data Transfer Objects
│   │   └── ...
│   └── ...
└── ...
```

## 🚀 Tech Stack

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool dan dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI Components
- **Lucide React** - Icons

### Backend
- **NestJS** - Node.js framework
- **TypeORM** - Database ORM
- **PostgreSQL** - Database
- **class-validator** - Validation
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Sebelum menjalankan project, pastikan Anda memiliki:

1. **Node.js** (versi 18 atau lebih baru)
2. **npm** atau **pnpm**
3. **PostgreSQL** database
4. **Environment variables** yang dikonfigurasi

## ⚙️ Setup

### 1. Clone dan Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd refactor

# Install dependencies untuk root project
npm install

# Install dependencies untuk frontend
cd frontend
npm install

# Install dependencies untuk backend
cd ../backend
npm install
```

### 2. Environment Variables

Buat file `.env` di folder `backend/`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/remoteretro

# Server
PORT=3000
NODE_ENV=development

# CORS (opsional)
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

Pastikan database PostgreSQL sudah berjalan dan buat database:

```sql
CREATE DATABASE remoteretro;
```

Jalankan script database initialization:

```bash
cd backend
npm run db:init
```

### 4. Development

#### Option 1: Menggunakan Script Batch (Windows)

```bash
# Jalankan semua services
start.bat

# Atau jalankan secara terpisah
backend.bat
frontend.bat
```

#### Option 2: Manual

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api

## 📚 API Endpoints

### Retrospectives
- `GET /api/retros` - Get all retrospectives
- `POST /api/retros` - Create new retrospective
- `GET /api/retros/:id` - Get specific retrospective
- `PUT /api/retros/:id` - Update retrospective
- `DELETE /api/retros/:id` - Delete retrospective

### Items
- `GET /api/retros/:id/items` - Get items for retrospective
- `POST /api/retros/:id/items` - Create new item
- `PUT /api/retros/:id/items/:itemId` - Update item
- `DELETE /api/retros/:id/items/:itemId` - Delete item
- `POST /api/retros/:id/items/:itemId/vote` - Vote for item

### Participants
- `GET /api/retros/:id/participants` - Get participants
- `POST /api/retros/:id/participants/join` - Join retrospective
- `DELETE /api/retros/:id/participants/:id` - Remove participant

### Dashboard
- `GET /api/dashboard/retros` - Get paginated retrospectives
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🔧 Development Commands

### Backend
```bash
cd backend

# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Database
npm run db:init
npm run db:migrate
```

### Frontend
```bash
cd frontend

# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

## 📦 Build untuk Production

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
```

## 🐛 Troubleshooting

### Database Connection Issues
1. Pastikan PostgreSQL berjalan
2. Periksa `DATABASE_URL` di `.env`
3. Pastikan database `remoteretro` sudah dibuat

### CORS Issues
1. Periksa `CORS_ORIGIN` di backend `.env`
2. Pastikan frontend berjalan di port yang benar

### Port Conflicts
- Backend default: 3000
- Frontend default: 5173
- Ubah port di konfigurasi jika diperlukan

## 📝 Features yang Sudah Dimigrasikan

✅ **Core Features**
- Create, read, update, delete retrospectives
- Add, edit, delete, vote items
- Join/leave retrospectives
- Dashboard dengan statistics
- Real-time updates (basic)

✅ **UI/UX**
- Responsive design
- Modern UI dengan Shadcn/ui
- Loading states
- Error handling
- Toast notifications

✅ **Backend**
- RESTful API dengan NestJS
- Database operations dengan TypeORM
- Input validation
- Error handling
- CORS configuration

## 🚧 Next Steps

1. **Authentication & Authorization**
   - User registration/login
   - Role-based access control
   - Session management

2. **Real-time Features**
   - WebSocket integration
   - Live collaboration
   - Real-time voting

3. **Advanced Features**
   - Retrospective templates
   - Export/import data
   - Advanced analytics
   - Email notifications

4. **Deployment**
   - Docker configuration
   - CI/CD pipeline
   - Production environment setup

## 📄 License

MIT License - lihat file LICENSE untuk detail.

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini. 