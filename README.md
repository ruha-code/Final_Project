# Clinic Management System

A web and mobile platform for managing patients, doctors, and appointments in a clinic environment.

---

## Problem Statement

Clinics often rely on paper-based or fragmented systems to manage patients, doctors, and appointments — leading to scheduling conflicts, lost records, and inefficient workflows. This system provides a centralized digital solution to streamline clinic operations for staff and patients.

---

## Features

- Patient record management (create, view, update)
- Doctor profile and schedule management
- Appointment booking and tracking
- Role-based access (admin, doctor, staff)
- REST API backend
- Responsive web interface
- Cross-platform mobile support

---

## Tech Stack

- Frontend: React, Tailwind CSS, Vite
- Backend: FastAPI, PostgreSQL, Alembic
- Mobile: Flutter
- Infrastructure: Docker, Docker Compose

---

## Installation

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Run with Docker

git clone https://github.com/ruha-code/Final_Project.git
cd Final_Project
cp backend/.env.example backend/.env
docker compose up --build
The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Run locally (without Docker)

Backend:
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
Frontend:
cd frontend
npm install
npm run dev
---

## Usage

1. Open the web app at http://localhost:5173
2. Log in with your credentials (admin / doctor / staff)
3. Navigate to Patients to manage patient records
4. Navigate to Appointments to book or view appointments
5. Doctors can view their schedule under My Schedule
6. Admins have access to user management and system settings

---

## Team Members

- Seiitkhan Zhannur – Backend Developer
- Ruslan Usen – Frontend Developer
- Askhat Yeleubay – Frontend Developer
- Margulan Baizhigit – Mobile Developer
