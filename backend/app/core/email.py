import logging
import resend
from app.core.config import settings

logger = logging.getLogger("clinic.email")

if settings.RESEND_API_KEY:
  resend.api_key = settings.RESEND_API_KEY


def _format_appointment_type(appointment_type: object) -> str:
    raw_value = getattr(appointment_type, "value", appointment_type)
    normalized = str(raw_value).strip()

    if not normalized:
        return "General Appointment"

    if "." in normalized:
        normalized = normalized.split(".")[-1]

    return normalized.replace("_", " ").title()


async def _send(to: str, subject: str, html: str) -> None:
    if not settings.EMAILS_ENABLED or not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL DISABLED] Would send '{subject}' → {to}")
        return

    try:
        params = {
            "from": f"Medlink Clinic <{settings.EMAILS_FROM}>",
            "to": [to],
            "subject": subject,
            "html": html,
        }
        email = resend.Emails.send(params)
        logger.info(f"[EMAIL] Sent '{subject}' → {to} (ID: {email['id']})")
    except Exception as exc:
        logger.error(f"[EMAIL] Failed to send '{subject}' → {to}: {exc}")


def _base_template(title: str, body: str) -> str:
    return f"""
    <html>
    <body style="margin:0;padding:0;background:#f3f6f8;font-family:Arial,sans-serif;color:#1f2937;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table width="640" cellpadding="0" cellspacing="0"
                   style="width:100%;max-width:640px;background:#ffffff;border:1px solid #dbe3e8;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:24px 32px;border-bottom:1px solid #e5eaee;background:#ffffff;">
                  <p style="margin:0;font-size:13px;line-height:18px;color:#0f766e;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                    Medlink
                  </p>
                  <p style="margin:6px 0 0;font-size:14px;line-height:20px;color:#6b7280;">
                    Clinic Management Platform
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 32px 0;">
                  <h1 style="margin:0;font-size:24px;line-height:32px;color:#111827;font-weight:700;">
                    {title}
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 32px 32px;font-size:15px;line-height:24px;color:#374151;">
                  {body}
                </td>
              </tr>
              <tr>
                <td style="padding:18px 32px;border-top:1px solid #e5eaee;background:#f9fafb;font-size:12px;line-height:18px;color:#6b7280;">
                  This is an automated email from Medlink. Please do not reply to this message.
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
    appointment_type_label = _format_appointment_type(appointment_type)
    reason_line = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
    body = f"""
        <p style="margin:0 0 16px;">Dear {patient_name},</p>
        <p style="margin:0 0 16px;">Your appointment has been scheduled successfully. Please review the details below.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e5eaee;border-radius:8px;overflow:hidden;">
          <tr style="background:#f9fafb;">
            <td style="padding:12px 14px;font-weight:700;width:38%;border-bottom:1px solid #e5eaee;">Doctor</td>
            <td style="padding:12px 14px;border-bottom:1px solid #e5eaee;">{doctor_name}</td>
          </tr>
          <tr>
            <td style="padding:12px 14px;font-weight:700;width:38%;border-bottom:1px solid #e5eaee;">Date and time</td>
            <td style="padding:12px 14px;border-bottom:1px solid #e5eaee;">{appointment_time}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:12px 14px;font-weight:700;width:38%;">Appointment type</td>
            <td style="padding:12px 14px;">{appointment_type_label}</td>
          </tr>
        </table>
        {reason_line}
        <p style="margin:16px 0 0;">Please arrive 10 minutes before the scheduled time. If you need to cancel or reschedule, please do so in advance through the clinic portal.</p>
        <p style="margin:16px 0 0;">Kind regards,<br>Medlink</p>
    """
    await _send(
        patient_email,
        "Appointment Confirmed",
        _base_template("Appointment Confirmation", body),
    )


async def send_new_appointment_alert(
    doctor_email: str,
    doctor_name: str,
    patient_name: str,
    appointment_time: str,
    appointment_type: str,
    reason: str | None,
) -> None:
    appointment_type_label = _format_appointment_type(appointment_type)
    reason_line = f"<p><strong>Patient's reason:</strong> {reason}</p>" if reason else ""
    body = f"""
        <p style="margin:0 0 16px;">Dear Dr. {doctor_name},</p>
        <p style="margin:0 0 16px;">A new appointment has been added to your schedule.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e5eaee;border-radius:8px;overflow:hidden;">
          <tr style="background:#f9fafb;">
            <td style="padding:12px 14px;font-weight:700;width:38%;border-bottom:1px solid #e5eaee;">Patient</td>
            <td style="padding:12px 14px;border-bottom:1px solid #e5eaee;">{patient_name}</td>
          </tr>
          <tr>
            <td style="padding:12px 14px;font-weight:700;width:38%;border-bottom:1px solid #e5eaee;">Date and time</td>
            <td style="padding:12px 14px;border-bottom:1px solid #e5eaee;">{appointment_time}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:12px 14px;font-weight:700;width:38%;">Appointment type</td>
            <td style="padding:12px 14px;">{appointment_type_label}</td>
          </tr>
        </table>
        {reason_line}
        <p style="margin:16px 0 0;">Please review your calendar and prepare accordingly.</p>
        <p style="margin:16px 0 0;">Kind regards,<br>Medlink</p>
    """
    await _send(
        doctor_email,
        "New Appointment Scheduled",
        _base_template("New Appointment Scheduled", body),
    )


async def send_cancellation_notice(
    email: str,
    recipient_name: str,
    other_party_name: str,
    appointment_time: str,
    cancelled_by: str,
) -> None:
    body = f"""
        <p style="margin:0 0 16px;">Dear {recipient_name},</p>
        <p style="margin:0 0 16px;">The appointment below has been cancelled by {cancelled_by}.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e5eaee;border-radius:8px;overflow:hidden;">
          <tr style="background:#f9fafb;">
            <td style="padding:12px 14px;font-weight:700;width:38%;border-bottom:1px solid #e5eaee;">Other party</td>
            <td style="padding:12px 14px;border-bottom:1px solid #e5eaee;">{other_party_name}</td>
          </tr>
          <tr>
            <td style="padding:12px 14px;font-weight:700;width:38%;">Scheduled for</td>
            <td style="padding:12px 14px;">{appointment_time}</td>
          </tr>
        </table>
        <p style="margin:16px 0 0;">If you need assistance with rescheduling, please contact the clinic through the Medlink portal.</p>
        <p style="margin:16px 0 0;">Kind regards,<br>Medlink</p>
    """
    await _send(
        email,
        "Appointment Cancelled",
        _base_template("Appointment Cancellation", body),
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
        <p style="margin:20px 0 8px;"><strong>Doctor's notes</strong></p>
        <blockquote style="margin:0;padding:14px 16px;border-left:4px solid #0f766e;background:#f9fafb;color:#374151;">
          {notes}
        </blockquote>
        """
        if notes
        else ""
    )
    body = f"""
        <p style="margin:0 0 16px;">Dear {patient_name},</p>
        <p style="margin:0 0 16px;">Your appointment with Dr. {doctor_name} on {appointment_time} has been completed.</p>
        {notes_section}
        <p style="margin:16px 0 0;">Thank you for choosing Medlink for your care.</p>
        <p style="margin:16px 0 0;">Kind regards,<br>Medlink</p>
    """
    await _send(
        patient_email,
        "Appointment Completed",
        _base_template("Visit Summary", body),
    )


async def send_new_message_notification(
    recipient_email: str,
    recipient_name: str,
    sender_name: str,
) -> None:
    body = f"""
        <p style="margin:0 0 16px;">Dear {recipient_name},</p>
        <p style="margin:0 0 16px;">You have received a new message from {sender_name} in the Medlink portal.</p>
        <p style="margin:0;">Please sign in to review and respond to the message.</p>
        <p style="margin:16px 0 0;">Kind regards,<br>Medlink</p>
    """
    await _send(
        recipient_email,
        f"New message from {sender_name}",
        _base_template("New Message Notification", body),
    )


async def send_verification_code(
    recipient_email: str,
    recipient_name: str,
    code: str,
) -> None:
    body = f"""
        <p style="margin:0 0 16px;">Dear {recipient_name},</p>
        <p style="margin:0 0 16px;">Thank you for creating a Medlink account. Please use the verification code below to complete your registration.</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;padding:16px 28px;border:1px solid #cbd5e1;border-radius:10px;background:#f9fafb;color:#111827;font-size:30px;line-height:32px;font-weight:700;letter-spacing:6px;">
            {code}
          </span>
        </div>
        <p style="margin:0;">This code will expire in 10 minutes. If you did not request this account, you may ignore this email.</p>
        <p style="margin:16px 0 0;">Kind regards,<br>Medlink</p>
    """
    await _send(
        recipient_email,
        "Verify Your Medlink Account",
        _base_template("Account Verification", body),
    )


async def send_password_reset(
    recipient_email: str,
    recipient_name: str,
    reset_link: str,
) -> None:
    body = f"""
        <p style="margin:0 0 16px;">Dear {recipient_name},</p>
        <p style="margin:0 0 16px;">We received a request to reset your Medlink password. To continue, please use the secure link below.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="{reset_link}"
             style="display:inline-block;background:#0f766e;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;">
            Reset Password
          </a>
        </div>
        <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#6b7280;">If the button does not open, copy and paste this link into your browser:</p>
        <p style="margin:0;font-size:13px;line-height:20px;">
        <a href="{reset_link}" style="color:#0f766e;word-break:break-all;">
          {reset_link}
        </a></p>
        <p style="margin:16px 0 0;">This link will expire in 30 minutes. If you did not request a password reset, no further action is required.</p>
        <p style="margin:16px 0 0;">Kind regards,<br>Medlink</p>
    """
    await _send(
        recipient_email,
        "Reset Your Medlink Password",
        _base_template("Password Reset Request", body),
    )
