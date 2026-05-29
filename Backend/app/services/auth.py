from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import jwt
from app.config.settings import settings

class AuthService:
    def _truncate_for_bcrypt(self, password: str) -> bytes:
        encoded = password.encode("utf-8")
        if len(encoded) <= 72:
            return encoded
        return encoded[:72]

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            password_bytes = self._truncate_for_bcrypt(plain_password)
            hashed_bytes = hashed_password.encode("utf-8")
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except Exception:
            return False

    def get_password_hash(self, password: str) -> str:
        password_bytes = self._truncate_for_bcrypt(password)
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode("utf-8")

    def needs_password_update(self, hashed_password: str) -> bool:
        return not hashed_password.startswith("$2b$")

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt

    def decode_token(self, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except Exception:
            return None

auth_service = AuthService()
