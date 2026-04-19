import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.core.security import decode_access_token
from app.core.cache import is_token_blacklisted
from app.core import event_bus
from app.modules.auth.models import User
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.doctors.models import Doctor
from app.modules.messages.models import Conversation, Message
from app.modules.messages.schemas import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    UnreadCountResponse,
)
from app.modules.messages.ws import manager
from app.modules.patients.models import Patient

router = APIRouter()
logger = logging.getLogger("clinic.messages")


def _load_opts():
    return [
        selectinload(Conversation.patient).selectinload(Patient.user),
        selectinload(Conversation.doctor).selectinload(Doctor.user),
        selectinload(Conversation.messages),
    ]


def _build_conv(conv: Conversation, current_user_id: int) -> ConversationResponse:
    msgs = sorted(conv.messages, key=lambda m: m.sent_at)
    last = msgs[-1] if msgs else None
    unread = sum(
        1 for m in msgs
        if not m.is_read and m.sender_id != current_user_id
    )
    return ConversationResponse(
        id=conv.id,
        patient_id=conv.patient_id,
        doctor_id=conv.doctor_id,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        patient_name=conv.patient.user.full_name if conv.patient else "",
        doctor_name=conv.doctor.user.full_name if conv.doctor else "",
        last_message=last.text if last else None,
        last_message_time=last.sent_at if last else None,
        unread_count=unread,
    )


async def _ensure_access(conv: Conversation, user: User, db: AsyncSession) -> None:
    """Raise ForbiddenException if the user is not part of this conversation."""
    if user.role == "ADMIN":
        return
    if user.role == "PATIENT":
        result = await db.execute(select(Patient).where(Patient.user_id == user.id))
        patient = result.scalar_one_or_none()
        if not patient or conv.patient_id != patient.id:
            raise ForbiddenException("This conversation does not belong to you")
    elif user.role == "DOCTOR":
        result = await db.execute(select(Doctor).where(Doctor.user_id == user.id))
        doctor = result.scalar_one_or_none()
        if not doctor or conv.doctor_id != doctor.id:
            raise ForbiddenException("This conversation does not belong to you")


async def _get_recipient_user_id(conv: Conversation, sender: User, db: AsyncSession) -> int | None:
    """Return the user_id of the other party in the conversation."""
    if sender.role == "PATIENT":
        result = await db.execute(
            select(Doctor).where(Doctor.id == conv.doctor_id)
        )
        doctor = result.scalar_one_or_none()
        return doctor.user_id if doctor else None
    elif sender.role == "DOCTOR":
        result = await db.execute(
            select(Patient).where(Patient.id == conv.patient_id)
        )
        patient = result.scalar_one_or_none()
        return patient.user_id if patient else None
    return None
@router.get(
    "/conversations",
    response_model=list[ConversationResponse],
    summary="Get my conversations (sorted by latest message)",
)
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

    query = query.order_by(Conversation.updated_at.desc())
    result = await db.execute(query)
    return [_build_conv(c, current_user.id) for c in result.scalars().all()]


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=201,
    summary="Start a conversation with a doctor",
)
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
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Doctor not found")

    result = await db.execute(
        select(Appointment).where(
            Appointment.patient_id == patient.id,
            Appointment.doctor_id == dto.doctor_id,
            Appointment.status != AppointmentStatus.CANCELLED,
        )
    )
    if result.scalar_one_or_none() is None:
        raise ForbiddenException(
            "You can only message doctors you have an appointment with"
        )

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
    return _build_conv(result.scalar_one(), current_user.id)


@router.get(
    "/conversations/{conv_id}/messages",
    response_model=list[MessageResponse],
    summary="Get paginated message history",
)
async def get_messages(
    conv_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, le=200),
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")

    await _ensure_access(conv, current_user, db)

    await db.execute(
        update(Message)
        .where(
            Message.conversation_id == conv_id,
            Message.sender_id != current_user.id,
            Message.is_read == False,
        )
        .values(is_read=True)
    )
    await db.commit()
    recipient_user_id = await _get_recipient_user_id(conv, current_user, db)
    refresh_user_ids = [current_user.id]
    if recipient_user_id is not None:
        refresh_user_ids.append(recipient_user_id)
    await event_bus.publish("notifications_refresh", {"user_ids": refresh_user_ids})

    offset = (page - 1) * page_size
    result = await db.execute(
        select(Message)
        .options(selectinload(Message.sender))
        .where(Message.conversation_id == conv_id)
        .order_by(Message.sent_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    msgs = list(reversed(result.scalars().all()))

    return [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            sender_id=m.sender_id,
            text=m.text,
            is_read=m.is_read,
            sent_at=m.sent_at,
            sender_name=m.sender.full_name if m.sender else "",
        )
        for m in msgs
    ]


@router.post(
    "/conversations/{conv_id}/messages",
    response_model=MessageResponse,
    status_code=201,
    summary="Send a message (REST fallback — prefer WebSocket)",
)
async def send_message(
    conv_id: int,
    dto: MessageCreate,
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).options(*_load_opts()).where(Conversation.id == conv_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")

    await _ensure_access(conv, current_user, db)

    msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        text=dto.text,
        sent_at=datetime.now(timezone.utc),
    )
    db.add(msg)

    await db.execute(
        update(Conversation)
        .where(Conversation.id == conv_id)
        .values(updated_at=datetime.now(timezone.utc))
    )
    await db.commit()

    result = await db.execute(
        select(Message).options(selectinload(Message.sender)).where(Message.id == msg.id)
    )
    msg = result.scalar_one()

    response = MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        text=msg.text,
        is_read=msg.is_read,
        sent_at=msg.sent_at,
        sender_name=msg.sender.full_name if msg.sender else "",
    )
    recipient_user_id = await _get_recipient_user_id(conv, current_user, db)
    if recipient_user_id:
        if manager.is_online(conv_id, recipient_user_id):
            await manager.send_to(conv_id, recipient_user_id, {
                "event": "new_message",
                **response.model_dump(mode="json"),
            })
        else:
            if current_user.role == "PATIENT" and conv.doctor:
                await event_bus.publish("message_sent", {
                    "recipient_email": conv.doctor.user.email,
                    "recipient_name": f"Dr. {conv.doctor.user.full_name}",
                    "sender_name": current_user.full_name,
                })
            elif current_user.role == "DOCTOR" and conv.patient:
                await event_bus.publish("message_sent", {
                    "recipient_email": conv.patient.user.email,
                    "recipient_name": conv.patient.user.full_name,
                    "sender_name": f"Dr. {current_user.full_name}",
                })
    refresh_user_ids = [current_user.id]
    if recipient_user_id is not None:
        refresh_user_ids.append(recipient_user_id)
    await event_bus.publish("notifications_refresh", {"user_ids": refresh_user_ids})

    return response


@router.put(
    "/conversations/{conv_id}/read",
    summary="Mark all messages in a conversation as read",
)
async def mark_as_read(
    conv_id: int,
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")

    await _ensure_access(conv, current_user, db)

    await db.execute(
        update(Message)
        .where(
            Message.conversation_id == conv_id,
            Message.sender_id != current_user.id,
            Message.is_read == False,
        )
        .values(is_read=True)
    )
    await db.commit()

    recipient_user_id = await _get_recipient_user_id(conv, current_user, db)
    if recipient_user_id and manager.is_online(conv_id, recipient_user_id):
        await manager.send_to(conv_id, recipient_user_id, {
            "event": "messages_read",
            "conv_id": conv_id,
            "read_by": current_user.id,
        })
    refresh_user_ids = [current_user.id]
    if recipient_user_id is not None:
        refresh_user_ids.append(recipient_user_id)
    await event_bus.publish("notifications_refresh", {"user_ids": refresh_user_ids})

    return {"message": "Messages marked as read"}


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Total unread messages across all conversations",
)
async def get_unread_count(
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == "PATIENT":
        result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        patient = result.scalar_one_or_none()
        if not patient:
            return UnreadCountResponse(total_unread=0)

        result = await db.execute(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.patient_id == patient.id,
                Message.sender_id != current_user.id,
                Message.is_read == False,
            )
        )
    else: 
        result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        doctor = result.scalar_one_or_none()
        if not doctor:
            return UnreadCountResponse(total_unread=0)

        result = await db.execute(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.doctor_id == doctor.id,
                Message.sender_id != current_user.id,
                Message.is_read == False,
            )
        )

    total = result.scalar() or 0
    return UnreadCountResponse(total_unread=total)


@router.websocket("/ws/{conv_id}")
async def chat_websocket(
    conv_id: int,
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
    db: AsyncSession = Depends(get_db),
):
    """
    Connect with:
        ws://host/messages/ws/{conv_id}?token=<access_token>

    Events the server sends:
        { "event": "new_message", ...MessageResponse fields }
        { "event": "messages_read", "conv_id": int, "read_by": int }
        { "event": "error", "detail": str }

    Events the client sends:
        { "text": "hello" }          → sends a message
        { "action": "read" }         → marks messages as read
    """
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Invalid token")
        return

    jti = payload.get("jti")
    if jti and await is_token_blacklisted(jti):
        await websocket.close(code=4001, reason="Token revoked")
        return

    user = await db.get(User, payload.get("user_id"))
    if not user or not user.is_active:
        await websocket.close(code=4001, reason="User not found or inactive")
        return

    
    result = await db.execute(
        select(Conversation).options(*_load_opts()).where(Conversation.id == conv_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        await websocket.close(code=4004, reason="Conversation not found")
        return

    try:
        await _ensure_access(conv, user, db)
    except ForbiddenException:
        await websocket.close(code=4003, reason="Access denied")
        return

    await manager.connect(conv_id, user.id, websocket)

    await db.execute(
        update(Message)
        .where(
            Message.conversation_id == conv_id,
            Message.sender_id != user.id,
            Message.is_read == False,
        )
        .values(is_read=True)
    )
    await db.commit()

    recipient_user_id = await _get_recipient_user_id(conv, user, db)
    if recipient_user_id and manager.is_online(conv_id, recipient_user_id):
        await manager.send_to(conv_id, recipient_user_id, {
            "event": "messages_read",
            "conv_id": conv_id,
            "read_by": user.id,
        })
    initial_refresh_user_ids = [user.id]
    if recipient_user_id is not None:
        initial_refresh_user_ids.append(recipient_user_id)
    await event_bus.publish(
        "notifications_refresh", {"user_ids": initial_refresh_user_ids}
    )

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("action") == "read":
                await db.execute(
                    update(Message)
                    .where(
                        Message.conversation_id == conv_id,
                        Message.sender_id != user.id,
                        Message.is_read == False,
                    )
                    .values(is_read=True)
                )
                await db.commit()
                if recipient_user_id and manager.is_online(conv_id, recipient_user_id):
                    await manager.send_to(conv_id, recipient_user_id, {
                        "event": "messages_read",
                        "conv_id": conv_id,
                        "read_by": user.id,
                    })
                refresh_user_ids = [user.id]
                if recipient_user_id is not None:
                    refresh_user_ids.append(recipient_user_id)
                await event_bus.publish(
                    "notifications_refresh", {"user_ids": refresh_user_ids}
                )
                continue

            text = data.get("text", "").strip()
            if not text:
                await websocket.send_json({"event": "error", "detail": "Empty message"})
                continue

            msg = Message(
                conversation_id=conv_id,
                sender_id=user.id,
                text=text,
                sent_at=datetime.now(timezone.utc),
                is_read=False,
            )
            db.add(msg)
            await db.execute(
                update(Conversation)
                .where(Conversation.id == conv_id)
                .values(updated_at=datetime.now(timezone.utc))
            )
            await db.commit()
            await db.refresh(msg)

            payload_out = {
                "event": "new_message",
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "sender_id": msg.sender_id,
                "sender_name": user.full_name,
                "text": msg.text,
                "is_read": msg.is_read,
                "sent_at": msg.sent_at.isoformat(),
            }

            await websocket.send_json(payload_out)

            if recipient_user_id:
                if manager.is_online(conv_id, recipient_user_id):
                    await manager.send_to(conv_id, recipient_user_id, payload_out)
                else:
                    if user.role == "PATIENT" and conv.doctor:
                        await event_bus.publish("message_sent", {
                            "recipient_email": conv.doctor.user.email,
                            "recipient_name": f"Dr. {conv.doctor.user.full_name}",
                            "sender_name": user.full_name,
                        })
                    elif user.role == "DOCTOR" and conv.patient:
                        await event_bus.publish("message_sent", {
                            "recipient_email": conv.patient.user.email,
                            "recipient_name": conv.patient.user.full_name,
                            "sender_name": f"Dr. {user.full_name}",
                        })
            refresh_user_ids = [user.id]
            if recipient_user_id is not None:
                refresh_user_ids.append(recipient_user_id)
            await event_bus.publish(
                "notifications_refresh", {"user_ids": refresh_user_ids}
            )

    except WebSocketDisconnect:
        manager.disconnect(conv_id, user.id)
        logger.info(f"[WS] user={user.id} disconnected from conv={conv_id}")
    except Exception as exc:
        logger.error(f"[WS] Unexpected error conv={conv_id} user={user.id}: {exc}")
        manager.disconnect(conv_id, user.id)
