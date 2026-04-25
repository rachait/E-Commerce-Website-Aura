import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from config import settings
import re

def generate_otp(length: int = 6) -> str:
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))

async def send_otp_email(email: str, otp: str, name: str = "User") -> bool:
    """
    Send OTP to email via SMTP
    Returns True if successful, False otherwise
    """
    try:
        # SMTP settings
        sender_email = settings.SENDER_EMAIL
        sender_password = settings.SENDER_PASSWORD
        smtp_server = settings.SMTP_SERVER
        smtp_port = settings.SMTP_PORT
        
        if not sender_email or not sender_password:
            print("⚠️  Email credentials not configured in .env file")
            return False
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Your AURA Login Verification Code"
        message["From"] = sender_email
        message["To"] = email
        
        # HTML email body
        html = f"""\
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #00f0ff; font-size: 28px; margin: 0;">AURA</h1>
                <p style="color: #999999; margin: 5px 0 0 0;">Premium eCommerce Platform</p>
              </div>
              
              <!-- Main Content -->
              <div style="background-color: #252525; border: 1px solid #333333; border-radius: 8px; padding: 30px;">
                <h2 style="color: #ffffff; margin-top: 0;">Hi {name},</h2>
                
                <p style="color: #cccccc; line-height: 1.6;">
                  Welcome to AURA! To complete your authentication, please use the verification code below:
                </p>
                
                <!-- OTP Box -->
                <div style="background-color: #1a1a1a; border: 2px solid #00f0ff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                  <p style="color: #999999; margin: 0 0 10px 0; font-size: 12px;">Verification Code</p>
                  <p style="font-size: 36px; font-weight: bold; color: #00f0ff; margin: 0; letter-spacing: 5px;">{otp}</p>
                </div>
                
                <p style="color: #cccccc; line-height: 1.6;">
                  This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
                </p>
                
                <hr style="border: none; border-top: 1px solid #333333; margin: 30px 0;">
                
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  If you didn't request this code, please ignore this email or contact support.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666666; font-size: 12px; margin: 0;">
                  © 2026 AURA. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
        """
        
        # Attach HTML
        part = MIMEText(html, "html")
        message.attach(part)
        
        # Send email
        if smtp_port == 465:
          with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, message.as_string())
        else:
          with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, message.as_string())
        
        print(f"[OK] OTP sent to {email}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to send OTP email: {str(e)}")
        return False

def is_valid_otp(stored_otp: str, provided_otp: str, expiry_time: datetime) -> bool:
    """
    Verify if OTP is valid
    Checks if OTP matches and hasn't expired
    """
    # Check if expired
    if datetime.utcnow() > expiry_time:
        return False
    
    # Check if OTP matches
    return stored_otp == provided_otp

def is_valid_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None
