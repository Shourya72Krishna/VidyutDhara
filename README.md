# ⚡ VidyutDhar – AI-Powered Productivity Platform

A production-ready, full-stack productivity SaaS platform built with React, Node.js, PostgreSQL, and OpenAI. Manage tasks, goals, habits, focus sessions, and notes — all with AI intelligence.

---

## 📸 Features

### Core Productivity
- ✅ **Tasks** – Full CRUD with priorities, due dates, tags, categories, subtasks, dependencies, recurring tasks, archive/restore
- 🎯 **Goals** – Long-term goal tracking with progress percentage and linked tasks
- ⚡ **Habits** – Daily/weekly/monthly habits with streak tracking and 28-day heatmap
- 📝 **Notes** – Rich text notes with tags, pinning, and auto-save
- ⏱️ **Focus Timer** – Pomodoro-style timer with session history and statistics
- 📊 **Dashboard** – Beautiful overview with charts, stats, and quick actions

### AI Features (requires OpenAI API key)
- 🤖 **AI Assistant** – Context-aware chat using your tasks/goals/habits
- ✨ **Task Breakdown** – Automatically decompose goals into actionable subtasks
- 📅 **Day Planner** – AI-generated optimized daily schedule

### Authentication & Security
- 🔐 Google OAuth 2.0
- 📧 Email/password with bcrypt hashing
- 🔑 JWT sessions with device/browser/IP tracking
- 🔒 Rate limiting, CORS, Helmet, input validation

### Admin System
- 👑 **Super Admin** – Create/remove admins, system analytics, settings
- 🛡️ **Admin** – User management, ban/suspend, activity & audit logs
- 👤 **User** – Personal productivity workspace

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Zustand, React Query |
| Styling | Custom CSS design system (no framework) |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | Passport.js (Google OAuth + Local) |
| AI | OpenAI GPT-4o-mini |
| Security | Helmet, express-rate-limit, bcryptjs, JWT |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
git clone <repo-url>
cd vidyutdhar
npm run install:all
```

### 2. Configure Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/vidyutdhar_db
JWT_SECRET=your_long_random_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
SUPER_ADMIN_EMAIL=superadmin@yourdomain.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
FRONTEND_URL=http://localhost:3000
```

### 3. Configure Frontend

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Set Up Database

```bash
# Create the database first
createdb vidyutdhar_db

# Push schema
npm run db:push

# Generate Prisma client
npm run db:generate
```

### 5. Run Development

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Prisma Studio: `npm run db:studio`

The Super Admin account is **auto-created** on first backend startup using your `.env` credentials.

---

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API** and **Google OAuth2 API**
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
6. Copy Client ID and Secret to `.env`

---

## 🤖 OpenAI Setup

1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add to `backend/.env` as `OPENAI_API_KEY`
4. The app uses `gpt-4o-mini` (cost-efficient model)

> Without an API key, AI features will return a 503 error but everything else works normally.

---

## 📁 Project Structure

```
vidyutdhar/
├── package.json              # Root scripts (monorepo)
├── README.md
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js            # Root with routing
│   │   ├── index.js
│   │   ├── context/
│   │   │   └── AuthStore.js  # Zustand auth store
│   │   ├── services/
│   │   │   └── api.js        # Axios API client
│   │   ├── styles/
│   │   │   └── globals.css   # Design system
│   │   ├── components/
│   │   │   └── shared/
│   │   │       └── AppLayout.js  # Sidebar + header
│   │   └── pages/
│   │       ├── Login.js
│   │       ├── Register.js
│   │       ├── ForgotPassword.js
│   │       ├── ResetPassword.js
│   │       ├── AuthCallback.js
│   │       ├── Dashboard.js
│   │       ├── Tasks.js
│   │       ├── Goals.js
│   │       ├── Habits.js
│   │       ├── Notes.js
│   │       ├── Focus.js
│   │       ├── AIAssistant.js
│   │       ├── Profile.js
│   │       ├── AdminPanel.js
│   │       └── SuperAdminPanel.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── server.js         # Express app entry
│   │   ├── config/
│   │   │   ├── prisma.js     # Prisma client
│   │   │   └── passport.js   # Auth strategies
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT protect + role guards
│   │   │   └── error.js      # Error handler
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── tasks.js
│   │   │   ├── goals.js
│   │   │   ├── habits.js
│   │   │   ├── notes.js
│   │   │   ├── focus.js
│   │   │   ├── ai.js
│   │   │   ├── admin.js
│   │   │   ├── superAdmin.js
│   │   │   ├── analytics.js
│   │   │   ├── notifications.js
│   │   │   ├── search.js
│   │   │   └── activity.js
│   │   └── utils/
│   │       ├── jwt.js
│   │       ├── logger.js
│   │       ├── seed.js
│   │       └── activityLogger.js
│   └── package.json
│
└── prisma/
    └── schema.prisma         # Complete DB schema
```

---

## 🔐 Default Credentials

After first run, the Super Admin is created automatically:

| Field | Value (from .env) |
|---|---|
| Email | `SUPER_ADMIN_EMAIL` |
| Password | `SUPER_ADMIN_PASSWORD` |

**Change these immediately in production!**

---

## 🚢 Production Deployment

### Environment

```env
NODE_ENV=production
DATABASE_URL=postgresql://...  # Use connection pooling (PgBouncer)
JWT_SECRET=<64-char random string>
FRONTEND_URL=https://yourdomain.com
```

### Build & Run

```bash
# Build frontend
npm run build

# Serve with PM2
npm install -g pm2
cd backend && pm2 start src/server.js --name vidyutdhar-api

# Serve frontend with Nginx (see nginx.conf below)
```

### Nginx Config

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend (React build)
    location / {
        root /var/www/vidyutdhar/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker (Optional)

```bash
# Add Dockerfiles for each service
docker-compose up -d
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout current session |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Start Google OAuth |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks (filterable) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/archive` | Toggle archive |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/breakdown` | Break goal into tasks |
| POST | `/api/ai/plan` | Generate daily plan |
| POST | `/api/ai/assistant` | Chat with AI assistant |

*(Full API docs for goals, habits, notes, focus, admin, etc. follow the same REST patterns)*

---

## 🔒 Security Features

- JWT tokens stored in HTTP-only cookies + localStorage fallback
- bcrypt password hashing (salt rounds: 12)
- Rate limiting: 100 req/15min globally, 20 req/15min for auth
- Helmet.js security headers
- CORS restricted to frontend origin
- Input validation with express-validator
- Prisma parameterized queries (SQL injection protection)
- Role-based access control (RBAC) middleware
- Audit logging for all admin actions

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License – see [LICENSE](LICENSE) for details.

---

Built with ❤️ · VidyutDhar Productivity OS
