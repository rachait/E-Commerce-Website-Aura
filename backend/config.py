import json
from typing import Any
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict

class Settings(BaseSettings):
    # ============ DATABASE ============
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "aura_ecommerce"
    
    # ============ API SETTINGS ============
    CORS_ORIGINS: Any = ["*"]
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_MAX_REQUESTS: int = 180
    
    # ============ JWT ============
    JWT_SECRET: str = "your-secret-key-here-min-32-chars-long-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # ============ OTP SETTINGS ============
    OTP_EXPIRY_MINUTES: int = 10
    
    # ============ EMAIL SETTINGS ============
    SENDER_EMAIL: str = ""  # Gmail address
    SENDER_PASSWORD: str = ""  # Gmail app-specific password
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    
    # ============ EXTERNAL SERVICES ============
    EMERGENT_LLM_KEY: str = ""
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    OPENAI_API_KEY: str = ""
    
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent / ".env"),
        env_file_encoding="utf-8"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value: Any) -> list[str]:
        if value is None:
            return ["*"]

        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]

        if isinstance(value, tuple):
            return [str(item).strip() for item in value if str(item).strip()]

        if isinstance(value, str):
            raw_value = value.strip()
            if not raw_value:
                return ["*"]

            try:
                parsed_value = json.loads(raw_value)
            except json.JSONDecodeError:
                parsed_value = None

            if isinstance(parsed_value, list):
                return [str(item).strip() for item in parsed_value if str(item).strip()]

            if isinstance(parsed_value, str):
                parsed_item = parsed_value.strip()
                return [parsed_item] if parsed_item else ["*"]

            cleaned_value = raw_value.replace("\\", "").strip("[]")
            return [
                item.strip().strip('"').strip("'")
                for item in cleaned_value.split(",")
                if item.strip().strip('"').strip("'")
            ] or ["*"]

        return [str(value).strip()] if str(value).strip() else ["*"]

settings = Settings()
