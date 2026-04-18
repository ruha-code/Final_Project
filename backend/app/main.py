from app.core.middleware import RequestLoggingMiddleware
from app.core.logging import setup_logging
from app.core import event_bus
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.core.database import init_db
from app.modules.auth.models import User
from app.modules.departments.models import Department
from app.modules.doctors.models import Doctor, DoctorSchedule
from app.modules.patients.models import Patient, HealthVital
from app.modules.appointments.models import Appointment
from app.modules.inventory.models import InventoryItem
from app.modules.messages.models import Conversation, Message
from app.modules.calendar.models import CalendarEvent
from app.modules.audit.models import AuditLog
from app.modules.notifications.models import NotificationRead, NotificationPreference

# Routers
from app.modules.auth.router import router as auth_router
from app.modules.patients.router import router as patients_router
from app.modules.doctors.router import router as doctors_router
from app.modules.appointments.router import router as appointments_router
from app.modules.departments.router import router as departments_router
from app.modules.inventory.router import router as inventory_router
from app.modules.messages.router import router as messages_router
from app.modules.calendar.router import router as calendar_router
from app.modules.audit.router import router as audit_router
from app.modules.analytics.router import router as analytics_router
from app.modules.notifications.router import router as notifications_router
from app.modules.search.router import router as search_router

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    event_bus.setup()
    await init_db()
    yield


app = FastAPI(
    title="Clinic Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

logger = logging.getLogger("clinic.errors")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    rid = getattr(request.state, "request_id", "unknown")
    logger.exception(f"Unhandled error [req={rid}] {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": rid},
    )


app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(patients_router, prefix="/patients", tags=["Patients"])
app.include_router(doctors_router, prefix="/doctors", tags=["Doctors"])
app.include_router(appointments_router, prefix="/appointments", tags=["Appointments"])
app.include_router(departments_router, prefix="/departments", tags=["Departments"])
app.include_router(inventory_router, prefix="/inventory", tags=["Inventory"])
app.include_router(messages_router, prefix="/messages", tags=["Messages"])
app.include_router(calendar_router, prefix="/calendar", tags=["Calendar"])
app.include_router(audit_router, prefix="/audit", tags=["Audit"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
app.include_router(search_router, prefix="/search", tags=["Search"])


@app.get("/")
async def root():
    return {"message": "Clinic Management System API"}
