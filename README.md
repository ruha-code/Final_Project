# Clinic Management System

A web and mobile platform for managing patients, doctors, and appointments in a clinic environment.

---

## Problem Statement

Clinics often rely on paper-based or fragmented systems to manage patients, doctors, and appointments — leading to scheduling conflicts, lost records, and inefficient workflows. This system provides a centralized digital solution to streamline clinic operations for staff and patients.

---

## Features

- **Patient Management**: Create, view, update patient records with health vitals tracking
- **Doctor Management**: Doctor profiles, specialties, schedules, and availability
- **Appointment System**: Book, track, and manage appointments with status updates
- **Department Management**: Organize clinic departments with statistics
- **Messaging**: Real-time chat between patients and doctors
- **Calendar Events**: Clinic-wide event scheduling and management
- **Analytics Dashboard**: Visual statistics and insights for administrators
- **Audit Logging**: Track all system actions for compliance
- **Search**: Global search across patients, doctors, and appointments
- **Notifications**: In-app notification system
- **Smart Chatbot Assistant**: Automated patient support with FAQ and context-aware responses based on patient data
- **Chatbot Assistant**: AI-powered patient support with FAQ and context-aware responses
- **Role-Based Access**: Admin, Doctor, and Patient roles with different permissions
- **Email Notifications**: Automated emails via Resend API
- **Responsive UI**: Mobile-friendly interface built with React and Tailwind CSS

---

## Tech Stack

### Frontend

- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API requests

### Backend

- FastAPI (Python 3.11+)
- PostgreSQL 16 with asyncpg
- Redis 7 for caching
- Alembic for database migrations
- Pydantic for data validation
- JWT authentication

### Email Service

- Resend API for transactional emails

### Infrastructure

- Docker & Docker Compose for local development
- Railway for backend hosting (PostgreSQL + Redis + API)
- Vercel for frontend hosting
- Cloudflare for DNS management

---

## Installation

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Run with Docker

```bash
git clone https://github.com/ruha-code/Final_Project.git
cd Final_Project

# Quick setup (creates .env files, starts services, runs seed)
.\init.ps1        # Windows
# or
./init.sh         # Linux/Mac

# Or manual setup:
cp backend/.env.example backend/.env
cp .env.example .env
# Edit .env files with your settings
docker compose up --build
```

The app will be available at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Configure Email (Resend)

1. Get API key from [resend.com](https://resend.com)
2. Set in `backend/.env`:

```env
EMAILS_ENABLED=True
RESEND_API_KEY=re_your_api_key_here
EMAILS_FROM=noreply@yourdomain.com
```

3. Restart the API container:

```bash
docker compose up -d --build api
```

### Run Locally (without Docker)

**Backend:**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

---

## Usage

### Default Credentials (after seeding)

Run seed script to populate test data:

```bash
# Via Docker (recommended)
docker compose exec api python seed.py

# Or via init script
.\init.ps1        # Windows
./init.sh         # Linux/Mac
```

**Admin:**

- Email: `admin@clinic.com`
- Password: Set `ADMIN_PASSWORD` in `.env` (default: `Admin123!`)

**Doctors:**

- `jwilson@clinic.com` (General Medicine)
- `schen@clinic.com` (Pediatrics)
- `mtorres@clinic.com` (Cardiology)
- `epark@clinic.com` (Orthopedics)
- `arivera@clinic.com` (Dermatology)
- `lnguyen@clinic.com` (Neurology)
- `rkim@clinic.com` (Radiology)
- `msantos@clinic.com` (Maternity)

**Patients:**

- `sjohnson@email.com`, `jdoe@email.com`, `ewilliams@email.com`, etc.

⚠️ If `ADMIN_PASSWORD` is not set in `.env`, passwords are generated randomly during seeding. Check the seed script output for generated passwords.

### Workflow

1. Open the web app at http://localhost:5173
2. Log in with your credentials
3. **Admin**: Manage users, view analytics, audit logs
4. **Doctor**: View schedule, manage appointments, chat with patients
5. **Patient**: Book appointments, view medical records, message doctors

---

## Project Structure

```
Final_Project/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── core/        # Config, database, security, middleware
│   │   └── modules/     # Feature modules (auth, patients, doctors, etc.)
│   ├── migrations/      # Alembic migrations
│   ├── Dockerfile
│   ├── requirements.txt
│   └── seed.py          # Test data seeder
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── layouts/     # Layout components
│   │   └── services/    # API services
│   ├── Dockerfile
│   ── package.json
├── mobile/              # Flutter mobile app
├── Dockerfile           # Root Dockerfile for Railway
├── railway.json         # Railway configuration
├── compose.yaml         # Docker Compose for local dev
└── compose.prod.yaml    # Docker Compose for production
```

---

## Deployment

### Production URLs

- **Frontend**: https://medlinks.uk
- **Backend API**: https://api.medlinks.uk
- **API Docs**: https://api.medlinks.uk/docs

### Railway (Backend + Database)

1. Connect GitHub repository to Railway
2. Add services: PostgreSQL, Redis
3. Set environment variables (see `backend/.env.example`)
4. Deploy backend service with root Dockerfile
5. Add custom domain `api.medlinks.uk` in Railway settings
6. Run seed script once via Railway Console: `python seed.py` (set `ALLOW_SEED=true` temporarily, then set back to `false`)

**Required Environment Variables:**

```env
SECRET_KEY=<generate-with-openssl-rand-hex-32>
DATABASE_URL=postgresql+asyncpg://postgres:<password>@postgres.railway.internal:5432/railway
REDIS_URL=redis://redis.railway.internal:6379
RESEND_API_KEY=re_your_api_key_here
EMAILS_FROM=noreply@medlinks.uk
FRONTEND_URL=https://medlinks.uk
ALLOW_SEED=false
```

### Vercel (Frontend)

1. Connect GitHub repository to Vercel
2. Set environment variable: `VITE_API_URL=https://api.medlinks.uk`
3. Deploy and add custom domain `medlinks.uk`

### DNS Configuration (Cloudflare)

| Type  | Name                 | Content                    | Proxy    |
| ----- | -------------------- | -------------------------- | -------- |
| A     | @                    | 76.76.21.21                | DNS only |
| CNAME | api                  | `<railway-backend-domain>` | DNS only |
| TXT   | \_railway-verify.api | `railway-verify=...`       | DNS only |

️ **Important**: CNAME record for `api` must be set to "DNS only" (gray cloud) for Railway verification.

---

## Team Members

- **Seiitkhan Zhannur** – Backend Developer
- **Ruslan Usen** – Frontend Developer
- **Askhat Yeleubay** – Frontend Developer
- **Margulan Baizhigit** – Mobile Developer

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
