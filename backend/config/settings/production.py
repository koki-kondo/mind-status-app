"""
Production settings for Mind Status application.
"""
import os
from .base import *
import dj_database_url

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "temporary-secret")

DEBUG = False

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost"
).split(",")

DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL")
    )
}

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

STATIC_ROOT = BASE_DIR / "staticfiles"

# WhiteNoise
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")

# CORS
raw_cors = os.getenv("CORS_ALLOWED_ORIGINS", "")
CORS_ALLOWED_ORIGINS = [origin for origin in raw_cors.split(",") if origin]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS