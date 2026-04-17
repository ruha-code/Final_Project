import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger("clinic.email")


async def _send(to: str, subject: str, html: str) -> None:
    if not settings.EMAILS_ENABLED:
        logger.info(f"[EMAIL DISABLED] Would send '{subject}' → {to}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAILS_FROM
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    try:
        smtp_username = settings.SMTP_USERNAME or None
        smtp_password = settings.SMTP_PASSWORD or None
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=smtp_username,
            password=smtp_password,
            start_tls=settings.SMTP_STARTTLS,
        )
        logger.info(f"[EMAIL] Sent '{subject}' → {to}")
    except Exception as exc:
        logger.error(f"[EMAIL] Failed to send '{subject}' → {to}: {exc}")


def _base_template(title: str, body: str) -> str:
    return f"""
    <html>
    <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:30px 0;">
            <table width="600" cellpadding="0" cellspacing="0"
                   style="background:#fff;border-radius:8px;overflow:hidden;
                          box-shadow:0 2px 8px rgba(0,0,0,.1);">
              <!-- Header -->
              <tr>
                <td style="background:#0ea5e9;padding:24px 32px;">
                  <h2 style="color:#fff;margin:0;font-size:20px;">
                    🏥 Clinic Management System
                  </h2>
                </td>
              </tr>
              <!-- Title -->
              <tr>
                <td style="padding:28px 32px 0;">
                  <h3 style="margin:0;color:#1e293b;font-size:18px;">{title}</h3>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:16px 32px 32px;color:#475569;font-size:15px;
                           line-height:1.6;">
                  {body}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:16px 32px;
                           color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;">
                  This is an automated message. Please do not reply directly to
                  this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


async def send_appointment_confirmation(
    patient_email: str,
    patient_name: str,
    doctor_name: str,
    appointment_time: str,
    appointment_type: str,
    reason: str | None,
) -> None:
    reason_line = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
    body = f"""
        <p>Dear <strong>{patient_name}</strong>,</p>
        <p>Your appointment has been successfully booked. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f1f5f9;">
            <td style="padding:10px 14px;font-weight:bold;">Doctor</td>
            <td style="padding:10px 14px;">{doctor_name}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:bold;">Date &amp; Time</td>
            <td style="padding:10px 14px;">{appointment_time}</td>
          </tr>
          <tr style="background:#f1f5f9;">
            <td style="padding:10px 14px;font-weight:bold;">Type</td>
            <td style="padding:10px 14px;">{appointment_type}</td>
          </tr>
        </table>
        {reason_line}
        <p>Please arrive 10 minutes early. If you need to cancel, do so at least
        24 hours in advance.</p>
        <p>See you soon!</p>
    """
    await _send(
        patient_email,
        "Appointment Confirmed",
        _base_template("Your appointment is confirmed ✅", body),
    )


async def send_new_appointment_alert(
    doctor_email: str,
    doctor_name: str,
    patient_name: str,
    appointment_time: str,
    appointment_type: str,
    reason: str | None,
) -> None:
    reason_line = f"<p><strong>Patient's reason:</strong> {reason}</p>" if reason else ""
    body = f"""
        <p>Dear <strong>Dr. {doctor_name}</strong>,</p>
        <p>A new appointment has been scheduled with you:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f1f5f9;">
            <td style="padding:10px 14px;font-weight:bold;">Patient</td>
            <td style="padding:10px 14px;">{patient_name}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:bold;">Date &amp; Time</td>
            <td style="padding:10px 14px;">{appointment_time}</td>
          </tr>
          <tr style="background:#f1f5f9;">
            <td style="padding:10px 14px;font-weight:bold;">Type</td>
            <td style="padding:10px 14px;">{appointment_type}</td>
          </tr>
        </table>
        {reason_line}
        <p>Please review your schedule and be prepared.</p>
    """
    await _send(
        doctor_email,
        "New Appointment Scheduled",
        _base_template("New appointment in your calendar 📅", body),
    )


async def send_cancellation_notice(
    email: str,
    recipient_name: str,
    other_party_name: str,
    appointment_time: str,
    cancelled_by: str,
) -> None:
    body = f"""
        <p>Dear <strong>{recipient_name}</strong>,</p>
        <p>The following appointment has been <strong style="color:#ef4444;">cancelled</strong>
        by <strong>{cancelled_by}</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f1f5f9;">
            <td style="padding:10px 14px;font-weight:bold;">Other party</td>
            <td style="padding:10px 14px;">{other_party_name}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:bold;">Was scheduled for</td>
            <td style="padding:10px 14px;">{appointment_time}</td>
          </tr>
        </table>
        <p>If you have questions, please contact the clinic directly.</p>
    """
    await _send(
        email,
        "Appointment Cancelled",
        _base_template("Appointment cancelled ❌", body),
    )


async def send_appointment_completed(
    patient_email: str,
    patient_name: str,
    doctor_name: str,
    appointment_time: str,
    notes: str | None,
) -> None:
    notes_section = (
        f"""
        <p><strong>Doctor's notes:</strong></p>
        <blockquote style="border-left:4px solid #0ea5e9;margin:12px 0;
                           padding:10px 16px;background:#f0f9ff;color:#0369a1;">
          {notes}
        </blockquote>
        """
        if notes
        else ""
    )
    body = f"""
        <p>Dear <strong>{patient_name}</strong>,</p>
        <p>Your appointment with <strong>Dr. {doctor_name}</strong> on
        <strong>{appointment_time}</strong> has been completed.</p>
        {notes_section}
        <p>Thank you for trusting our clinic. Take care!</p>
    """
    await _send(
        patient_email,
        "Appointment Completed",
        _base_template("Your visit summary 📋", body),
    )


async def send_new_message_notification(
    recipient_email: str,
    recipient_name: str,
    sender_name: str,
) -> None:
    body = f"""
        <p>Dear <strong>{recipient_name}</strong>,</p>
        <p>You have a new message from <strong>{sender_name}</strong>
        in the clinic portal.</p>
        <p>Log in to read and reply.</p>
    """
    await _send(
        recipient_email,
        f"New message from {sender_name}",
        _base_template("You have a new message 💬", body),
    )
