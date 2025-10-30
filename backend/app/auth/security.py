from passlib.context import CryptContext


# Use PBKDF2-SHA256 to avoid bcrypt dependency and 72-byte limit
password_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return password_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_context.verify(plain_password, hashed_password)


