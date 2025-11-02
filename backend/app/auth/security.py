from passlib.context import CryptContext


# Use bcrypt for secure password hashing. Ensure 'bcrypt' is installed in requirements.
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return password_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return password_context.verify(plain_password, hashed_password)


