from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from app.config.settings import settings

pwd_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")

class AuthService:
    def _truncate_for_bcrypt(self, password: str) -> str:
        encoded = password.encode("utf-8")
        if len(encoded) <= 72:
            return password
        return encoded[:72].decode("utf-8", errors="ignore")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            scheme = pwd_context.identify(hashed_password)
            candidate = (
                self._truncate_for_bcrypt(plain_password)
                if scheme == "bcrypt"
                else plain_password
            )
            return pwd_context.verify(candidate, hashed_password)
        except ValueError:
            # Handles bcrypt's 72-byte limit and malformed hashes without crashing login.
            return False

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def needs_password_update(self, hashed_password: str) -> bool:
        return pwd_context.needs_update(hashed_password)

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
