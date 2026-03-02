from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.enums import RoleEnum
from app.models.user import RefreshToken, User

settings = get_settings()


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def seed_default_user(self) -> None:
        stmt = select(User).where(User.email == "lopez@hospital.com.ar")
        user = self.db.scalar(stmt)
        if user:
            return
        user = User(
            name="Farm. Lopez",
            email="lopez@hospital.com.ar",
            password_hash=hash_password("admin123"),
            role=RoleEnum.farmaceutico,
        )
        self.db.add(user)
        self.db.commit()

    def login(self, email: str, password: str) -> tuple[User, str, str]:
        stmt = select(User).where(User.email == email)
        user = self.db.scalar(stmt)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        access_token, _ = create_access_token(user.id)
        refresh_token, jti, refresh_exp = create_refresh_token(user.id)
        self.db.add(RefreshToken(user_id=user.id, jti=jti, expires_at=refresh_exp))
        self.db.commit()
        return user, access_token, refresh_token

    def refresh(self, token: str) -> tuple[str, str]:
        try:
            payload = decode_token(token)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        jti = payload.get("jti")
        user_id = payload.get("sub")
        if not jti or not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        stmt = select(RefreshToken).where(RefreshToken.jti == jti)
        stored = self.db.scalar(stmt)
        if not stored or stored.revoked or stored.expires_at < datetime.now(UTC):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired/revoked")

        stored.revoked = True
        access_token, _ = create_access_token(user_id)
        refresh_token, new_jti, refresh_exp = create_refresh_token(user_id)
        self.db.add(RefreshToken(user_id=user_id, jti=new_jti, expires_at=refresh_exp))
        self.db.commit()
        return access_token, refresh_token
