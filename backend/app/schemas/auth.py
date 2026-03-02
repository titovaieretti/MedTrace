from pydantic import BaseModel, EmailStr

from app.models.enums import RoleEnum


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserMe(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: RoleEnum


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserMe
