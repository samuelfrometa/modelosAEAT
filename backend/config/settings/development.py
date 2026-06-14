from decouple import config

from .base import *  # noqa: F401,F403

DEBUG = config("DEBUG", default=True, cast=bool)
HOST_URL = config("HOST_URL", cast=str)
HOST_PROTOCOL = config("HOST_PROTOCOL", default="http", cast=str)
HOST_ORIGIN = f"{HOST_PROTOCOL}://{HOST_URL}"

ALLOWED_HOSTS = ["*"]

CORS_ALLOWED_ORIGINS = [
    HOST_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
]
