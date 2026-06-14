# django-drf-template

Plantilla de proyecto Django 6 + Django REST Framework lista para usar. Incluye autenticación JWT, soft-delete, UUID PKs, multi-entorno y suite de tests con pytest + factory-boy.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Django 6 + DRF 3.17 |
| Auth | SimpleJWT (access + refresh tokens) |
| Base de datos | PostgreSQL (SQLite en tests) |
| Gestor de paquetes | `uv` |
| Linter / Formatter | Ruff |
| Tests | pytest + pytest-django + factory-boy |

---

## Estructura

```
apps/api/
├── admin/          → Configuración del panel de administración
├── lib/            → Utilidades internas (exception handler)
├── management/     → Comandos de gestión personalizados
├── migrations/     → Migraciones de base de datos
├── models/
│   ├── abstracts/  → BaseModel (UUID PK + soft-delete + timestamps)
│   └── *.py        → Un archivo por entidad de dominio
├── serializers/    → Par Read/Write por entidad + auth
├── tests/          → conftest, factories y test_*.py por recurso
├── views/          → APIViews sueltas (auth: login, refresh, me)
├── viewsets/       → ModelViewSet por entidad
└── urls.py         → Router + rutas manuales
config/
├── settings/
│   ├── base.py         → Configuración común
│   ├── development.py  → Dev local (PostgreSQL, DEBUG=True)
│   ├── production.py   → Producción (variables de entorno estrictas)
│   ├── staging.py      → Hereda de production
│   └── testing.py      → SQLite en memoria, hashers rápidos
├── urls.py
├── wsgi.py
└── asgi.py
```

---

## Arrancar un proyecto nuevo

### 1. Copiar la plantilla

```bash
cp -r django-drf-template/ mi-proyecto-api/
cd mi-proyecto-api/
```

### 2. Renombrar el proyecto

Busca y reemplaza `my-project-api` en `pyproject.toml` con el nombre real del proyecto.

### 3. Crear el entorno e instalar dependencias

```bash
uv sync
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus valores reales
```

Genera una `SECRET_KEY`:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 5. Crear la base de datos y aplicar migraciones

```bash
uv run python manage.py migrate
```

### 6. Crear superusuario

```bash
uv run python manage.py createsuperuser
```

### 7. Arrancar el servidor

```bash
uv run python manage.py runserver
```

---

## Añadir un nuevo recurso

El flujo es siempre el mismo. Ejemplo: añadir `Product`.

### 1. Modelo — `apps/api/models/product.py`

```python
from django.db import models
from apps.api.models.abstracts import BaseModel

class Product(BaseModel):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta(BaseModel.Meta):
        verbose_name = "producto"
        verbose_name_plural = "productos"

    def __str__(self) -> str:
        return self.name
```

Exporta desde `apps/api/models/__init__.py`:

```python
from apps.api.models.product import Product
# añade "Product" a __all__
```

### 2. Serializers — `apps/api/serializers/product.py`

```python
from rest_framework import serializers
from apps.api.models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ("id", "name", "price", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ("name", "price")
```

Exporta desde `apps/api/serializers/__init__.py`.

### 3. ViewSet — `apps/api/viewsets/product.py`

```python
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from apps.api.models import Product
from apps.api.serializers import ProductSerializer, ProductWriteSerializer

class ProductViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = Product.objects.all()
    search_fields = ("name",)
    ordering_fields = ("name", "price", "created_at")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ProductWriteSerializer
        return ProductSerializer
```

Exporta desde `apps/api/viewsets/__init__.py`.

### 4. Admin — `apps/api/admin/product.py`

```python
from django.contrib import admin
from apps.api.models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "active", "created_at")
    search_fields = ("name",)
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
```

Exporta desde `apps/api/admin/__init__.py`.

### 5. Registrar la URL — `apps/api/urls.py`

```python
from apps.api.viewsets import ProductViewSet

router.register("products", ProductViewSet, basename="product")
```

### 6. Migración

```bash
uv run python manage.py makemigrations
uv run python manage.py migrate
```

### 7. Factory + Tests — `apps/api/tests/`

```python
# factories.py
class ProductFactory(DjangoModelFactory):
    name = factory.Sequence(lambda n: f"Product {n}")
    price = factory.Faker("pydecimal", left_digits=4, right_digits=2, positive=True)
    class Meta:
        model = Product
```

```python
# test_products.py
LIST_URL = reverse("api:product-list")
# ... patrón idéntico a test_example.py
```

---

## Recursos anidados

Para rutas tipo `/clients/{client_pk}/notes/`, registra el ViewSet manualmente en lugar de con el router:

```python
# urls.py
note_list   = NoteViewSet.as_view({"get": "list", "post": "create"})
note_detail = NoteViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"})

urlpatterns += [
    path("clients/<uuid:client_pk>/notes/",          note_list,   name="client-notes-list"),
    path("clients/<uuid:client_pk>/notes/<uuid:pk>/", note_detail, name="client-notes-detail"),
]
```

En el ViewSet, sobrescribe `get_queryset` y `perform_create` para inyectar el padre:

```python
def get_queryset(self):
    client_pk = self.kwargs["client_pk"]
    return Note.objects.filter(client_id=client_pk)

def perform_create(self, serializer):
    serializer.save(client_id=self.kwargs["client_pk"], author=self.request.user)
```

---

## BaseModel — contratos importantes

Todos los modelos heredan de `BaseModel`, que proporciona:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `UUIDField` | PK autogenerada, no editable |
| `created_at` | `DateTimeField` | Se rellena al crear |
| `updated_at` | `DateTimeField` | Se actualiza automáticamente |
| `deleted_at` | `DateTimeField` | `NULL` = vivo, fecha = eliminado lógicamente |
| `active` | `BooleanField` | `True` = activo, `False` = deshabilitado |

- `Model.objects` → solo registros vivos (`deleted_at IS NULL AND active=True`)
- `Model.all_objects` → todos los registros sin filtro (para admin e internos)

Para eliminar lógicamente un registro:

```python
from django.utils import timezone
instance = MyModel.objects.get(pk=pk)
MyModel.all_objects.filter(pk=instance.pk).update(deleted_at=timezone.now())
```

---

## Autenticación JWT

Los endpoints disponibles desde el arranque son:

| Método | URL | Descripción |
|---|---|---|
| `POST` | `/v1/auth/login/` | Obtener access + refresh token |
| `POST` | `/v1/auth/refresh/` | Renovar access token |
| `GET` | `/v1/auth/me/` | Datos del usuario autenticado |

El token de acceso incluye los claims `email`, `role` y `full_name` además del estándar `user_id`.

Cabecera de autorización: `Authorization: Bearer <access_token>`

---

## Ejecutar tests

```bash
uv run pytest                        # todos los tests
uv run pytest apps/api/tests/test_example.py  # un archivo concreto
uv run pytest --cov=apps --cov-report=term-missing  # con cobertura
```

---

## Linting y formato

```bash
uv run ruff check .        # linting
uv run ruff check . --fix  # auto-fix
uv run ruff format .       # formatear
```

---

## Variables de entorno necesarias

| Variable | Descripción | Ejemplo |
|---|---|---|
| `SECRET_KEY` | Clave secreta Django | `django-insecure-...` |
| `DEBUG` | Modo debug | `True` / `False` |
| `HOST_URL` | Host sin protocolo | `localhost:8000` |
| `HOST_PROTOCOL` | Protocolo | `http` / `https` |
| `DB_NAME` | Nombre de la BD | `myproject_db` |
| `DB_USER` | Usuario de la BD | `myproject_user` |
| `DB_PASSWORD` | Contraseña de la BD | `secret` |
| `DB_HOST` | Host de la BD | `localhost` |
| `DB_PORT` | Puerto de la BD | `5432` |
