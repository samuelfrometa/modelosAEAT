from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.api.models.abstracts import BaseModel


class UserManager(BaseUserManager):
    """
    Custom manager for the email-authenticated User model.

    Overrides get_queryset() so authenticate() and every standard ORM lookup
    respect the soft-delete / soft-disable contract defined on BaseModel.
    """

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset().filter(deleted_at__isnull=True, active=True)

    def _create_user(self, email: str, password: str, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """Platform user. Authenticates with email and password."""

    class Role(models.IntegerChoices):
        ADMIN = 1, "Admin"
        # TODO: add project-specific roles here

    first_name = models.CharField(max_length=150, verbose_name="First name")
    last_name = models.CharField(max_length=150, verbose_name="Last name", blank=True)
    email = models.EmailField(
        max_length=255,
        unique=True,
        verbose_name="Email",
        db_index=True,
    )
    phone = models.CharField(max_length=17, blank=True, verbose_name="Phone")
    role = models.IntegerField(
        choices=Role.choices,
        default=Role.ADMIN,
        verbose_name="Role",
        db_index=True,
    )
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now, verbose_name="Date joined")

    objects = UserManager()
    all_objects = BaseUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name"]

    class Meta(BaseModel.Meta):
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]
        indexes = [
            models.Index(fields=["email", "is_active"]),
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["role", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.get_full_name()} ({self.email})"

    def get_full_name(self) -> str:
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.email

    def get_short_name(self) -> str:
        return self.first_name
