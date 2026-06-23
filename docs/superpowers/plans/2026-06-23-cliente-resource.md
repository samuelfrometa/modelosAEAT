# Cliente Resource Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully tested `Cliente` REST resource with role-based access — gestores manage their own clients, clientes read only their own record.

**Architecture:** Single `Cliente` model with a `tipo` field (FISICA/JURIDICA). Role-based queryset filtering and serializer selection in one `ClienteViewSet`. Two new roles (`GESTOR`, `CLIENTE`) added to `User.Role`.

**Tech Stack:** Django 6, DRF 3.17, pytest + factory-boy, uv

## Global Constraints

- All commands run from `backend/`
- Run tests with: `uv run pytest`
- Run migrations with: `uv run python manage.py makemigrations && uv run python manage.py migrate`
- Follow one-file-per-entity convention: one file per model, serializer, viewset, admin, test
- Export every new class from its package `__init__.py`
- Soft-delete via `Cliente.all_objects.filter(pk=pk).update(deleted_at=timezone.now())`, never `instance.delete()`

---

### Task 1: Add GESTOR and CLIENTE roles to User

**Files:**
- Modify: `apps/api/models/user.py` — add two roles to `User.Role`
- Modify: `apps/api/tests/factories.py` — add `gestor` and `cliente` traits to `UserFactory`
- Create: migration (auto-generated)

**Interfaces:**
- Produces: `User.Role.GESTOR = 2`, `User.Role.CLIENTE = 3` — used in Tasks 3 and 4

- [ ] **Step 1: Add roles to User.Role**

In `apps/api/models/user.py`, replace the `Role` inner class:

```python
class Role(models.IntegerChoices):
    ADMIN = 1, "Admin"
    GESTOR = 2, "Gestor"
    CLIENTE = 3, "Cliente"
```

- [ ] **Step 2: Generate and apply migration**

```bash
uv run python manage.py makemigrations
uv run python manage.py migrate
```

Expected output: `Migrations for 'api': apps/api/migrations/0002_alter_user_role.py` (or similar) followed by `Running migrations: Applying api.0002... OK`

- [ ] **Step 3: Add gestor and cliente traits to UserFactory**

In `apps/api/tests/factories.py`, add two traits inside `UserFactory.Params`:

```python
class Params:
    superuser = factory.Trait(
        is_superuser=True,
        is_staff=True,
        role=User.Role.ADMIN,
    )
    inactive = factory.Trait(
        is_active=False,
    )
    gestor = factory.Trait(
        role=User.Role.GESTOR,
    )
    cliente = factory.Trait(
        role=User.Role.CLIENTE,
    )
```

- [ ] **Step 4: Verify existing tests still pass**

```bash
uv run pytest apps/api/tests/test_example.py -v
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/models/user.py apps/api/tests/factories.py apps/api/migrations/
git commit -m "feat(auth): add GESTOR and CLIENTE roles to User"
```

---

### Task 2: Cliente model and migration

**Files:**
- Create: `apps/api/models/cliente.py`
- Modify: `apps/api/models/__init__.py` — export `Cliente`
- Create: migration (auto-generated)

**Interfaces:**
- Produces: `Cliente` model with fields: `tipo`, `nif`, `nombre`, `apellidos`, `razon_social`, `email`, `telefono`, `calle`, `codigo_postal`, `municipio`, `provincia`, `user` (OneToOne→User, nullable), `created_by` (FK→User)
- Produces: `Cliente.Tipo.FISICA` and `Cliente.Tipo.JURIDICA` text choices

- [ ] **Step 1: Create the model file**

Create `apps/api/models/cliente.py`:

```python
from django.db import models

from apps.api.models.abstracts import BaseModel


class Cliente(BaseModel):
    class Tipo(models.TextChoices):
        FISICA = "FISICA", "Persona física"
        JURIDICA = "JURIDICA", "Persona jurídica"

    tipo = models.CharField(
        max_length=10,
        choices=Tipo.choices,
        verbose_name="tipo",
    )
    nif = models.CharField(max_length=9, unique=True, verbose_name="NIF/CIF")
    nombre = models.CharField(max_length=150, verbose_name="nombre")
    apellidos = models.CharField(max_length=200, blank=True, verbose_name="apellidos")
    razon_social = models.CharField(max_length=200, blank=True, verbose_name="razón social")
    email = models.EmailField(verbose_name="email")
    telefono = models.CharField(max_length=20, blank=True, verbose_name="teléfono")
    calle = models.CharField(max_length=255, verbose_name="calle")
    codigo_postal = models.CharField(max_length=5, verbose_name="código postal")
    municipio = models.CharField(max_length=100, verbose_name="municipio")
    provincia = models.CharField(max_length=100, verbose_name="provincia")
    user = models.OneToOneField(
        "api.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cliente_perfil",
        verbose_name="usuario vinculado",
    )
    created_by = models.ForeignKey(
        "api.User",
        on_delete=models.PROTECT,
        related_name="clientes_gestionados",
        verbose_name="gestor",
    )

    class Meta(BaseModel.Meta):
        verbose_name = "cliente"
        verbose_name_plural = "clientes"

    def __str__(self) -> str:
        if self.tipo == self.Tipo.FISICA:
            return f"{self.nombre} {self.apellidos} ({self.nif})"
        return f"{self.razon_social} ({self.nif})"
```

- [ ] **Step 2: Export from models/__init__.py**

Add to `apps/api/models/__init__.py`:

```python
from apps.api.models.abstracts import ActiveManager, BaseModel, UUIDPrimaryKeyModel
from apps.api.models.cliente import Cliente
from apps.api.models.example import Example
from apps.api.models.user import User, UserManager

__all__ = [
    "ActiveManager",
    "BaseModel",
    "Cliente",
    "Example",
    "UUIDPrimaryKeyModel",
    "User",
    "UserManager",
]
```

- [ ] **Step 3: Generate and apply migration**

```bash
uv run python manage.py makemigrations
uv run python manage.py migrate
```

Expected output: `Migrations for 'api': apps/api/migrations/0003_cliente.py` followed by `Applying api.0003... OK`

- [ ] **Step 4: Verify Django can import the model**

```bash
uv run python manage.py shell -c "from apps.api.models import Cliente; print(Cliente)"
```

Expected: `<class 'apps.api.models.cliente.Cliente'>`

- [ ] **Step 5: Commit**

```bash
git add apps/api/models/cliente.py apps/api/models/__init__.py apps/api/migrations/
git commit -m "feat(cliente): add Cliente model with FISICA/JURIDICA types"
```

---

### Task 3: Write failing tests (TDD)

**Files:**
- Modify: `apps/api/tests/factories.py` — add `ClienteFactory`
- Create: `apps/api/tests/test_cliente.py`

**Interfaces:**
- Consumes: `Cliente` from Task 2, `User.Role.GESTOR` and `User.Role.CLIENTE` from Task 1
- Consumes: `UserFactory` with `.gestor` and `.cliente` traits from Task 1

- [ ] **Step 1: Add ClienteFactory to factories.py**

Append to `apps/api/tests/factories.py` (add the import at the top too):

```python
from apps.api.models import Cliente, Example, User
```

Then add at the end of the file:

```python
class ClienteFactory(DjangoModelFactory):
    """Factory for Cliente model instances. Default tipo: FISICA."""

    tipo = Cliente.Tipo.FISICA
    nif = factory.Sequence(lambda n: f"{n:08d}A")
    nombre = factory.Faker("first_name", locale="es_ES")
    apellidos = factory.Faker("last_name", locale="es_ES")
    razon_social = ""
    email = factory.Faker("email")
    telefono = ""
    calle = factory.Faker("street_address", locale="es_ES")
    codigo_postal = "28001"
    municipio = "Madrid"
    provincia = "Madrid"
    user = None
    created_by = factory.SubFactory(UserFactory, gestor=True)

    class Meta:
        model = Cliente

    class Params:
        juridica = factory.Trait(
            tipo=Cliente.Tipo.JURIDICA,
            apellidos="",
            razon_social=factory.Faker("company"),
            nif=factory.Sequence(lambda n: f"B{n:07d}0"),
        )
```

- [ ] **Step 2: Create test file**

Create `apps/api/tests/test_cliente.py`:

```python
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.api.models import Cliente, User
from apps.api.tests.factories import ClienteFactory, UserFactory

URL_LIST = "/v1/clientes/"


def url_detail(pk):
    return f"/v1/clientes/{pk}/"


# ── Gestor: queryset filtering ─────────────────────────────────────────────

@pytest.mark.django_db
def test_gestor_sees_only_own_clients(api_client):
    gestor_a = UserFactory(gestor=True)
    gestor_b = UserFactory(gestor=True)
    ClienteFactory(created_by=gestor_a)
    ClienteFactory(created_by=gestor_b)

    api_client.force_authenticate(user=gestor_a)
    response = api_client.get(URL_LIST)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1


@pytest.mark.django_db
def test_gestor_cannot_access_another_gestors_client(api_client):
    gestor_a = UserFactory(gestor=True)
    gestor_b = UserFactory(gestor=True)
    cliente = ClienteFactory(created_by=gestor_b)

    api_client.force_authenticate(user=gestor_a)
    response = api_client.get(url_detail(cliente.pk))

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ── Gestor: CRUD ───────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_gestor_can_create_cliente_fisica(api_client):
    gestor = UserFactory(gestor=True)
    api_client.force_authenticate(user=gestor)

    payload = {
        "tipo": "FISICA",
        "nif": "12345678A",
        "nombre": "Ana",
        "apellidos": "García López",
        "email": "ana@ejemplo.com",
        "calle": "Calle Mayor 1",
        "codigo_postal": "28001",
        "municipio": "Madrid",
        "provincia": "Madrid",
    }
    response = api_client.post(URL_LIST, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Cliente.objects.filter(nif="12345678A").exists()
    assert Cliente.objects.get(nif="12345678A").created_by == gestor


@pytest.mark.django_db
def test_gestor_can_create_cliente_juridica(api_client):
    gestor = UserFactory(gestor=True)
    api_client.force_authenticate(user=gestor)

    payload = {
        "tipo": "JURIDICA",
        "nif": "B12345670",
        "nombre": "Acme",
        "razon_social": "Acme S.L.",
        "email": "info@acme.com",
        "calle": "Av. Diagonal 1",
        "codigo_postal": "08001",
        "municipio": "Barcelona",
        "provincia": "Barcelona",
    }
    response = api_client.post(URL_LIST, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_gestor_can_update_own_client(api_client):
    gestor = UserFactory(gestor=True)
    cliente = ClienteFactory(created_by=gestor)
    api_client.force_authenticate(user=gestor)

    response = api_client.patch(
        url_detail(cliente.pk),
        {"municipio": "Sevilla"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    cliente.refresh_from_db()
    assert cliente.municipio == "Sevilla"


@pytest.mark.django_db
def test_gestor_can_soft_delete_own_client(api_client):
    gestor = UserFactory(gestor=True)
    cliente = ClienteFactory(created_by=gestor)
    api_client.force_authenticate(user=gestor)

    response = api_client.delete(url_detail(cliente.pk))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Cliente.objects.filter(pk=cliente.pk).exists()
    assert Cliente.all_objects.filter(pk=cliente.pk).exists()


# ── Cliente role: read-only ────────────────────────────────────────────────

@pytest.mark.django_db
def test_cliente_user_sees_only_own_record(api_client):
    gestor = UserFactory(gestor=True)
    user_a = UserFactory(cliente=True)
    user_b = UserFactory(cliente=True)
    ClienteFactory(created_by=gestor, user=user_a)
    ClienteFactory(created_by=gestor, user=user_b)

    api_client.force_authenticate(user=user_a)
    response = api_client.get(URL_LIST)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1


@pytest.mark.django_db
def test_cliente_user_cannot_create(api_client):
    user = UserFactory(cliente=True)
    api_client.force_authenticate(user=user)

    response = api_client.post(URL_LIST, {}, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_cliente_user_cannot_update(api_client):
    gestor = UserFactory(gestor=True)
    user = UserFactory(cliente=True)
    cliente = ClienteFactory(created_by=gestor, user=user)
    api_client.force_authenticate(user=user)

    response = api_client.patch(url_detail(cliente.pk), {"municipio": "X"}, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_cliente_user_cannot_delete(api_client):
    gestor = UserFactory(gestor=True)
    user = UserFactory(cliente=True)
    cliente = ClienteFactory(created_by=gestor, user=user)
    api_client.force_authenticate(user=user)

    response = api_client.delete(url_detail(cliente.pk))

    assert response.status_code == status.HTTP_403_FORBIDDEN


# ── Validation ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_duplicate_nif_rejected(api_client):
    gestor = UserFactory(gestor=True)
    ClienteFactory(created_by=gestor, nif="12345678A")
    api_client.force_authenticate(user=gestor)

    payload = {
        "tipo": "FISICA",
        "nif": "12345678A",
        "nombre": "Otro",
        "apellidos": "Apellido",
        "email": "otro@ejemplo.com",
        "calle": "Calle 1",
        "codigo_postal": "28001",
        "municipio": "Madrid",
        "provincia": "Madrid",
    }
    response = api_client.post(URL_LIST, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "nif" in response.data


@pytest.mark.django_db
def test_fisica_without_apellidos_rejected(api_client):
    gestor = UserFactory(gestor=True)
    api_client.force_authenticate(user=gestor)

    payload = {
        "tipo": "FISICA",
        "nif": "12345678A",
        "nombre": "Ana",
        "email": "ana@ejemplo.com",
        "calle": "Calle 1",
        "codigo_postal": "28001",
        "municipio": "Madrid",
        "provincia": "Madrid",
    }
    response = api_client.post(URL_LIST, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "apellidos" in response.data


@pytest.mark.django_db
def test_juridica_without_razon_social_rejected(api_client):
    gestor = UserFactory(gestor=True)
    api_client.force_authenticate(user=gestor)

    payload = {
        "tipo": "JURIDICA",
        "nif": "B12345670",
        "nombre": "Empresa",
        "email": "info@empresa.com",
        "calle": "Calle 1",
        "codigo_postal": "08001",
        "municipio": "Barcelona",
        "provincia": "Barcelona",
    }
    response = api_client.post(URL_LIST, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "razon_social" in response.data


@pytest.mark.django_db
def test_invalid_codigo_postal_rejected(api_client):
    gestor = UserFactory(gestor=True)
    api_client.force_authenticate(user=gestor)

    payload = {
        "tipo": "FISICA",
        "nif": "12345678A",
        "nombre": "Ana",
        "apellidos": "García",
        "email": "ana@ejemplo.com",
        "calle": "Calle 1",
        "codigo_postal": "ABCDE",
        "municipio": "Madrid",
        "provincia": "Madrid",
    }
    response = api_client.post(URL_LIST, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "codigo_postal" in response.data


# ── Auth ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_unauthenticated_request_rejected(api_client):
    response = api_client.get(URL_LIST)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
```

- [ ] **Step 3: Run tests — verify they all fail**

```bash
uv run pytest apps/api/tests/test_cliente.py -v
```

Expected: all tests fail with `404 Not Found` or import errors because the viewset and URL are not registered yet.

- [ ] **Step 4: Commit**

```bash
git add apps/api/tests/factories.py apps/api/tests/test_cliente.py
git commit -m "test(cliente): add ClienteFactory and failing integration tests"
```

---

### Task 4: Serializers, viewset, URL registration, and admin

**Files:**
- Create: `apps/api/serializers/cliente.py`
- Modify: `apps/api/serializers/__init__.py`
- Create: `apps/api/viewsets/cliente.py`
- Modify: `apps/api/viewsets/__init__.py`
- Create: `apps/api/admin/cliente.py`
- Modify: `apps/api/admin/__init__.py`
- Modify: `apps/api/urls.py`

**Interfaces:**
- Consumes: `Cliente` model from Task 2, `User.Role.GESTOR` from Task 1
- Produces: `GET/POST /v1/clientes/`, `GET/PUT/PATCH/DELETE /v1/clientes/{id}/`

- [ ] **Step 1: Create serializers**

Create `apps/api/serializers/cliente.py`:

```python
import re

from rest_framework import serializers

from apps.api.models import Cliente


class ClienteWriteSerializer(serializers.ModelSerializer):
    """Write serializer for gestores: create and update clients."""

    class Meta:
        model = Cliente
        fields = (
            "tipo", "nif", "nombre", "apellidos", "razon_social",
            "email", "telefono", "calle", "codigo_postal",
            "municipio", "provincia", "user",
        )

    def validate_nif(self, value):
        return value.upper().strip()

    def validate_codigo_postal(self, value):
        if not re.match(r"^\d{5}$", value):
            raise serializers.ValidationError(
                "El código postal debe tener exactamente 5 dígitos numéricos."
            )
        return value

    def validate(self, data):
        tipo = data.get("tipo") if "tipo" in data else getattr(self.instance, "tipo", None)
        apellidos = data.get("apellidos", getattr(self.instance, "apellidos", ""))
        razon_social = data.get("razon_social", getattr(self.instance, "razon_social", ""))

        if tipo == Cliente.Tipo.FISICA and not apellidos:
            raise serializers.ValidationError(
                {"apellidos": "Los apellidos son obligatorios para personas físicas."}
            )
        if tipo == Cliente.Tipo.JURIDICA and not razon_social:
            raise serializers.ValidationError(
                {"razon_social": "La razón social es obligatoria para personas jurídicas."}
            )
        return data


class ClienteGestorReadSerializer(serializers.ModelSerializer):
    """Read serializer for gestores: all fields including audit columns."""

    class Meta:
        model = Cliente
        fields = (
            "id", "tipo", "nif", "nombre", "apellidos", "razon_social",
            "email", "telefono", "calle", "codigo_postal",
            "municipio", "provincia", "user", "created_by",
            "created_at", "updated_at",
        )
        read_only_fields = fields


class ClienteReadSerializer(serializers.ModelSerializer):
    """Read-only serializer for users with role=CLIENTE."""

    class Meta:
        model = Cliente
        fields = (
            "id", "tipo", "nif", "nombre", "apellidos", "razon_social",
            "email", "telefono", "calle", "codigo_postal",
            "municipio", "provincia", "created_at", "updated_at",
        )
        read_only_fields = fields
```

- [ ] **Step 2: Export serializers from __init__.py**

Replace `apps/api/serializers/__init__.py`:

```python
from apps.api.serializers.auth import CustomTokenObtainPairSerializer
from apps.api.serializers.cliente import (
    ClienteGestorReadSerializer,
    ClienteReadSerializer,
    ClienteWriteSerializer,
)
from apps.api.serializers.example import ExampleSerializer, ExampleWriteSerializer
from apps.api.serializers.register import RegisterSerializer
from apps.api.serializers.user import UserSerializer

__all__ = [
    "ClienteGestorReadSerializer",
    "ClienteReadSerializer",
    "ClienteWriteSerializer",
    "CustomTokenObtainPairSerializer",
    "ExampleSerializer",
    "ExampleWriteSerializer",
    "RegisterSerializer",
    "UserSerializer",
]
```

- [ ] **Step 3: Create viewset**

Create `apps/api/viewsets/cliente.py`:

```python
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.api.models import Cliente, User
from apps.api.serializers import (
    ClienteGestorReadSerializer,
    ClienteReadSerializer,
    ClienteWriteSerializer,
)


class ClienteViewSet(ModelViewSet):
    """CRUD endpoints for Cliente. Behaviour depends on the caller's role."""

    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.GESTOR:
            return Cliente.objects.filter(created_by=user)
        return Cliente.objects.filter(user=user)

    def get_serializer_class(self):
        user = self.request.user
        if user.role == User.Role.GESTOR:
            if self.action in ("list", "retrieve"):
                return ClienteGestorReadSerializer
            return ClienteWriteSerializer
        return ClienteReadSerializer

    def _require_gestor(self):
        if self.request.user.role != User.Role.GESTOR:
            raise PermissionDenied("Solo los gestores pueden realizar esta acción.")

    def create(self, request, *args, **kwargs):
        self._require_gestor()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._require_gestor()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._require_gestor()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._require_gestor()
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        Cliente.all_objects.filter(pk=instance.pk).update(deleted_at=timezone.now())
```

- [ ] **Step 4: Export viewset from __init__.py**

Replace `apps/api/viewsets/__init__.py`:

```python
from apps.api.viewsets.cliente import ClienteViewSet
from apps.api.viewsets.example import ExampleViewSet

__all__ = ["ClienteViewSet", "ExampleViewSet"]
```

- [ ] **Step 5: Register URL**

In `apps/api/urls.py`, add the import and router registration:

```python
from apps.api.viewsets import ClienteViewSet, ExampleViewSet

# inside the file, add to the router section:
router.register("clientes", ClienteViewSet, basename="cliente")
```

The full `urls.py` after the change:

```python
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.api.views import LoginView, MeView, RefreshTokenView, RegisterView
from apps.api.viewsets import ClienteViewSet, ExampleViewSet

app_name = "api"

router = DefaultRouter()
router.register("examples", ExampleViewSet, basename="example")
router.register("clientes", ClienteViewSet, basename="cliente")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("", include(router.urls)),
]
```

- [ ] **Step 6: Create admin**

Create `apps/api/admin/cliente.py`:

```python
from django.contrib import admin

from apps.api.models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    """Admin configuration for Cliente."""

    list_display = ("nif", "nombre", "tipo", "provincia", "active", "created_at")
    list_filter = ("tipo", "provincia", "active")
    search_fields = ("nif", "nombre", "razon_social", "email")
    ordering = ("nombre",)
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")

    def get_queryset(self, request):
        return Cliente.all_objects.all()

    fieldsets = (
        (
            "Identificación",
            {"fields": ("tipo", "nif", "nombre", "apellidos", "razon_social")},
        ),
        (
            "Contacto",
            {"fields": ("email", "telefono")},
        ),
        (
            "Dirección fiscal",
            {"fields": ("calle", "codigo_postal", "municipio", "provincia")},
        ),
        (
            "Relaciones",
            {"fields": ("user", "created_by")},
        ),
        (
            "Metadata",
            {
                "classes": ("collapse",),
                "fields": ("id", "active", "created_at", "updated_at", "deleted_at"),
            },
        ),
    )
```

- [ ] **Step 7: Export admin from __init__.py**

Replace `apps/api/admin/__init__.py`:

```python
from apps.api.admin.cliente import ClienteAdmin
from apps.api.admin.example import ExampleAdmin
from apps.api.admin.user import UserAdmin

__all__ = ["ClienteAdmin", "ExampleAdmin", "UserAdmin"]
```

- [ ] **Step 8: Run the full test suite**

```bash
uv run pytest apps/api/tests/test_cliente.py -v
```

Expected: all tests pass. If any fail, read the error and fix before committing.

- [ ] **Step 9: Run all tests to check for regressions**

```bash
uv run pytest -v
```

Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
git add apps/api/serializers/cliente.py apps/api/serializers/__init__.py \
        apps/api/viewsets/cliente.py apps/api/viewsets/__init__.py \
        apps/api/admin/cliente.py apps/api/admin/__init__.py \
        apps/api/urls.py
git commit -m "feat(cliente): add serializers, viewset, admin and URL registration"
```
