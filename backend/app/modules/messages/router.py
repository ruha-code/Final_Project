from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
 
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.modules.auth.models import User
from app.modules.patients.models import Patient
from app.modules.doctors.models import Doctor
from app.modules.messages.models import Conversation, Message
from app.modules.messages.schemas import (
    ConversationCreate, ConversationResponse,
    MessageCreate, MessageResponse,
)
 
router = APIRouter()
 
 
def _build_conv(conv: Conversation) -> ConversationResponse:
    last = conv.messages[-1] if conv.messages else None
    return ConversationResponse(
        id=conv.id,
        patient_id=conv.patient_id,
        doctor_id=conv.doctor_id,
        created_at=conv.created_at,
        patient_name=conv.patient.user.full_name if conv.patient else "",
        doctor_name=conv.doctor.user.full_name if conv.doctor else "",
        last_message=last.text if last else None,
        last_message_time=last.sent_at if last else None,
    )
 
 
def _load_opts():
    return [
        selectinload(Conversation.patient).selectinload(Patient.user),
        selectinload(Conversation.doctor).selectinload(Doctor.user),
        selectinload(Conversation.messages),
    ]
 
 
@router.get("/conversations", response_model=list[ConversationResponse], summary="Get my conversations")
async def get_conversations(
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    query = select(Conversation).options(*_load_opts())
 
    if current_user.role == "PATIENT":
        result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        patient = result.scalar_one_or_none()
        if not patient:
            return []
        query = query.where(Conversation.patient_id == patient.id)
    elif current_user.role == "DOCTOR":
        result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        doctor = result.scalar_one_or_none()
        if not doctor:
            return []
        query = query.where(Conversation.doctor_id == doctor.id)
 
    result = await db.execute(query)
    return [_build_conv(c) for c in result.scalars().all()]
 
 
@router.post("/conversations", response_model=ConversationResponse, status_code=201, summary="Start a conversation")
async def create_conversation(
    dto: ConversationCreate,
    current_user: User = Depends(RoleChecker(["PATIENT"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Set up your patient profile first")
 
    result = await db.execute(select(Doctor).where(Doctor.id == dto.doctor_id))
    if not result.scalar_one_or_none():
        raise NotFoundException("Doctor not found")
 
    result = await db.execute(
        select(Conversation).where(
            Conversation.patient_id == patient.id,
            Conversation.doctor_id == dto.doctor_id,
        )
    )
    if result.scalar_one_or_none():
        raise ConflictException("Conversation with this doctor already exists")
 
    conv = Conversation(patient_id=patient.id, doctor_id=dto.doctor_id)
    db.add(conv)
    await db.commit()
 
    result = await db.execute(
        select(Conversation).options(*_load_opts()).where(Conversation.id == conv.id)
    )
    return _build_conv(result.scalar_one())
 
 
@router.get("/conversations/{conv_id}/messages", response_model=list[MessageResponse], summary="Get messages in a conversation")
async def get_messages(
    conv_id: int,
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages).selectinload(Message.sender))
        .where(Conversation.id == conv_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")
 
    msgs = []
    for m in sorted(conv.messages, key=lambda x: x.sent_at):
        msgs.append(MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            sender_id=m.sender_id,
            text=m.text,
            is_read=m.is_read,
            sent_at=m.sent_at,
            sender_name=m.sender.full_name if m.sender else "",
        ))
    return msgs
 
 
@router.post("/conversations/{conv_id}/messages", response_model=MessageResponse, status_code=201, summary="Send a message")
async def send_message(
    conv_id: int,
    dto: MessageCreate,
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")
 
    msg = Message(conversation_id=conv_id, sender_id=current_user.id, text=dto.text)
    db.add(msg)
    await db.commit()
 
    result = await db.execute(
        select(Message).options(selectinload(Message.sender)).where(Message.id == msg.id)
    )
    msg = result.scalar_one()
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        text=msg.text,
        is_read=msg.is_read,
        sent_at=msg.sent_at,
        sender_name=msg.sender.full_name if msg.sender else "",
    )