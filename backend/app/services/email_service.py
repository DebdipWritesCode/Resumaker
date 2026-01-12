import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from app.settings.get_env import SMTP_EMAIL, SMTP_APP_PASSWORD

logger = logging.getLogger(__name__)

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def load_email_template() -> str:
    """Load the HTML email template"""
    template_path = Path(__file__).parent.parent / "templates" / "email" / "verification.html"
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to load email template: {e}")
        raise

def load_password_reset_template() -> str:
    """Load the password reset HTML email template"""
    template_path = Path(__file__).parent.parent / "templates" / "email" / "password_reset.html"
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to load password reset email template: {e}")
        raise

def load_email_change_template() -> str:
    """Load the email change HTML email template"""
    template_path = Path(__file__).parent.parent / "templates" / "email" / "email_change.html"
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to load email change email template: {e}")
        raise

def send_verification_email(user_email: str, user_name: str, otp: str) -> None:
    """
    Send verification email with OTP to user
    
    Args:
        user_email: User's email address
        user_name: User's first name
        otp: 6-digit OTP code
    """
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        logger.error("SMTP credentials not configured")
        raise ValueError("SMTP email and app password must be configured")
    
    try:
        # Load template
        template = load_email_template()
        
        # Replace placeholders
        html_content = template.replace("{{user_name}}", user_name)
        html_content = html_content.replace("{{otp}}", otp)
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify Your Email - Resumaker"
        msg["From"] = SMTP_EMAIL
        msg["To"] = user_email
        
        # Create HTML part
        html_part = MIMEText(html_content, "html")
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Verification email sent to {user_email}")
        
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error while sending verification email: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        raise

def send_password_reset_email(user_email: str, user_name: str, otp: str) -> None:
    """
    Send password reset email with OTP to user
    
    Args:
        user_email: User's email address
        user_name: User's first name
        otp: 6-digit OTP code
    """
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        logger.error("SMTP credentials not configured")
        raise ValueError("SMTP email and app password must be configured")
    
    try:
        # Load template
        template = load_password_reset_template()
        
        # Replace placeholders
        html_content = template.replace("{{user_name}}", user_name)
        html_content = html_content.replace("{{otp}}", otp)
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset Your Password - Resumaker"
        msg["From"] = SMTP_EMAIL
        msg["To"] = user_email
        
        # Create HTML part
        html_part = MIMEText(html_content, "html")
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Password reset email sent to {user_email}")
        
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error while sending password reset email: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        raise

def send_email_change_otp(user_email: str, user_name: str, otp: str) -> None:
    """
    Send email change OTP email to user
    
    Args:
        user_email: User's email address
        user_name: User's first name
        otp: 6-digit OTP code
    """
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        logger.error("SMTP credentials not configured")
        raise ValueError("SMTP email and app password must be configured")
    
    try:
        # Load template
        template = load_email_change_template()
        
        # Replace placeholders
        html_content = template.replace("{{user_name}}", user_name)
        html_content = html_content.replace("{{otp}}", otp)
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Change Your Email - Resumaker"
        msg["From"] = SMTP_EMAIL
        msg["To"] = user_email
        
        # Create HTML part
        html_part = MIMEText(html_content, "html")
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email change OTP email sent to {user_email}")
        
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error while sending email change OTP: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to send email change OTP email: {e}")
        raise
