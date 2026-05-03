# Clinic Management System

A web and mobile platform for managing patients, doctors, appointments, and clinic communication in one system.

---

## Problem Statement

Many clinics still rely on paper files, scattered spreadsheets, or disconnected tools. That causes scheduling conflicts, slow coordination, missing records, and weak visibility into clinic activity. This project centralizes patient management, doctor scheduling, appointments, messaging, notifications, and analytics in a single system.

---

## How It Works

- Admin users manage doctors, departments, appointments, users, and analytics from the web dashboard.
- Patients can register, log in, book appointments, review their records, and communicate with doctors.
- Doctors can manage schedules, review patient information, update appointments, and respond to messages.
- The FastAPI backend handles authentication, business logic, database access, notifications, and chatbot-related features.
- The Flutter mobile app extends the platform with a mobile client for clinic workflows.

---

## Project Scope

This repository contains three connected parts:

- **Web frontend**: React + Vite dashboard for admins, doctors, and patients
- **Backend API**: FastAPI service with PostgreSQL and Redis
- **Mobile app**: Flutter client located in `mobile/hospital_app`

---

## Core Features

- Patient management with health vitals tracking
- Doctor profiles, schedules, and availability
- Appointment booking and status management
- Department management and clinic statistics
- Real-time messaging between patients and doctors
- Calendar events and clinic scheduling
- Analytics dashboard for administrators
- Audit logging for system actions
- Global search across system entities
- Notification preferences and in-app notifications
- Chatbot assistant for patient support
- Role-based access for admin, doctor, and patient accounts
- Automated email notifications through Resend
- Responsive web interface

---

## Tech Stack

### Web Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Recharts

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis
- Alembic
- JWT authentication

### Mobile

- Flutter
- Firebase configuration for mobile client setup

### Infrastructure

- Docker and Docker Compose
- Railway for backend hosting
- Vercel for frontend hosting
- Cloudflare for DNS

---

## Repository Structure

```text
Final_Project/
|-- backend/                # FastAPI backend
|   |-- app/                # Core app and feature modules
|   |-- migrations/         # Alembic migrations
|   |-- tests/              # Backend tests
|   |-- .env.example        # Backend environment template
|   `-- seed.py             # Demo data seeding script
|-- frontend/               # React frontend
|   |-- src/
|   |-- .env.example        # Frontend environment template
|   `-- Dockerfile
|-- mobile/
|   `-- hospital_app/       # Flutter mobile application
|-- assets/                 # Branding, diagrams, screenshots
|-- docs/                   # Deployment and architecture notes
|-- .env.example            # Root Docker Compose environment template
|-- compose.yaml            # Local development stack
`-- compose.prod.yaml       # Production-oriented compose file
```

---

## Local Run

### Prerequisites

- Docker Desktop with Docker Compose
- Node.js 18+ if you want to run frontend outside Docker
- Python 3.11+ if you want to run backend outside Docker
- Flutter SDK if you want to run the mobile app

### Quick Start with Docker

1. Copy the environment templates:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Review the values before running:

- In root `.env`, keep local URLs:
  - `FRONTEND_URL=http://localhost:5173`
  - `VITE_API_URL=http://localhost:8000`
- In `backend/.env`, keep local backend services:
  - `DATABASE_URL=postgresql+asyncpg://clinic_user:clinic123@localhost:5432/clinic_db`
  - `REDIS_URL=redis://localhost:6379`
- Keep `ALLOW_SEED=true` for the first local setup if you want demo data.

3. Start the stack:

```bash
docker compose up -d --build
```

4. Seed demo data:

```bash
docker compose exec api python seed.py
```

5. Open the project:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- pgAdmin: `http://localhost:8080`

### Setup Scripts

You can also use:

```bash
./init.sh
```

or on Windows:

```powershell
.\init.ps1
```

These scripts copy missing `.env` files, start Docker services, and then run the seed script.

---

## Default Demo Access

After seeding, use:

- Admin email: `admin@clinic.com`
- Admin password: value of `ADMIN_PASSWORD` from your local `.env`

Doctor and patient demo accounts are created by the seed script as well.

If `ADMIN_PASSWORD` is removed, the script generates random passwords and prints them in the terminal during seeding.

---

## Run Without Docker

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Mobile

```bash
cd mobile/hospital_app
flutter pub get
flutter run
```

The mobile app is in `mobile/hospital_app` and is documented as a companion client for the clinic system.

---

## Mobile App Notes

- The mobile application is built with Flutter.
- Firebase client configuration files are present for app setup.
- To run it successfully, use the Flutter SDK and a configured Android emulator or physical device.
- The mobile app folder currently has its own starter README, but the main project documentation should be treated as the primary guide for this repository.

---

## Environment Files

### Root `.env`

Used by Docker Compose for local orchestration:

- PostgreSQL container credentials
- frontend build API URL
- local frontend URL
- pgAdmin credentials

### `backend/.env`

Used by the FastAPI application:

- JWT secret and auth settings
- database connection string
- Redis connection string
- Resend email settings
- frontend origin for CORS and reset links
- seed configuration

### `frontend/.env`

Used by the Vite frontend:

- `VITE_API_URL`

---

## Security Notes

- Do **not** commit real `.env` files to Git.
- Do **not** commit private API keys or server secrets.
- If the lecturer needs your `.env`, share it privately, not through the repository.
- Before publishing the repository, rotate any sensitive keys that were ever exposed during development.

---

## Deployment

### Production URLs

- Frontend: [https://medlinks.uk](https://medlinks.uk)
- Backend API: [https://api.medlinks.uk](https://api.medlinks.uk)
- API docs: [https://api.medlinks.uk/docs](https://api.medlinks.uk/docs)

### Backend Deployment

Backend is intended for Railway with PostgreSQL and Redis.

Required production variables include:

```env
SECRET_KEY=<secure-random-value>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=postgresql+asyncpg://postgres:<password>@postgres.railway.internal:5432/railway
REDIS_URL=redis://redis.railway.internal:6379
FRONTEND_URL=https://medlinks.uk
EMAILS_ENABLED=True
RESEND_API_KEY=<resend-api-key>
EMAILS_FROM=noreply@medlinks.uk
ALLOW_SEED=false
```

Set `ALLOW_SEED=true` only temporarily when first populating production demo data, then set it back to `false`.

### Frontend Deployment

Frontend is intended for Vercel.

Required production frontend variable:

```env
VITE_API_URL=https://api.medlinks.uk
```

---

## Documentation

- Deployment notes: [docs/deployment.md](docs/deployment.md)
- Architecture notes: [docs/architecture.md](docs/architecture.md)

---

## Team Members

- ID: 230109009 Seiitkhan Zhannur - Backend Developer
- ID: 230103026 Ruslan Usen - Frontend Developer
- ID: 230103304 Askhat Yeleubay - Frontend Developer
- ID: 230103065 Margulan Baizhigit - Mobile Developer

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
