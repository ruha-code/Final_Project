from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import init_db

# Import all models so SQLAlchemy registers them before create_all
from app.modules.auth.models import User                        
from app.modules.departments.models import Department           
from app.modules.doctors.models import Doctor, DoctorSchedule  
from app.modules.patients.models import Patient, HealthVital   
from app.modules.appointments.models import Appointment         
from app.modules.inventory.models import InventoryItem         
from app.modules.messages.models import Conversation, Message  
from app.modules.calendar.models import CalendarEvent          
from app.modules.audit.models import AuditLog                  


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Clinic Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Clinic Management System API"}
