from typing import List, Union, Optional
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    APP_NAME: str = "Coffee Shop POS"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "coffeeshop_pos"

    # Security
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = ["*"]

    # Cloudinary Credentials (Resilient local uploads fallback if unset)
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # POS Config
    SHOP_NAME: str = "Daily Grind Coffee"
    TAX_RATE: float = 0.10
    LOYALTY_POINT_REWARD_RATE: float = 0.10

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        return v

settings = Settings()

# Runtime validation warnings
import warnings
if settings.JWT_SECRET_KEY == "change-me":
    warnings.warn(
        "JWT_SECRET_KEY is set to the default value 'change-me'. "
        "This is insecure for production. Set JWT_SECRET_KEY in your .env file.",
        UserWarning,
        stacklevel=2
    )
