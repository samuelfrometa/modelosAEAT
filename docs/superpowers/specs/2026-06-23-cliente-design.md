# Cliente Resource Design

**Date:** 2026-06-23
**Status:** Approved

## Overview

Add a `Cliente` resource to the backend. A client represents either an individual (persona física) or a company (persona jurídica) that files AEAT tax declarations. Users with `role="gestor"` manage multiple clients; users with `role="cliente"` are linked to a single client record of their own.

## Model

**File:** `backend/apps/api/models/cliente.py`

Inherits from `BaseModel` (UUID PK, `created_at`, `updated_at`, soft-delete via `deleted_at` + `active`).

| Field | Type | Notes |
|---|---|---|
| `tipo` | `CharField(choices)` | `FISICA` or `JURIDICA` |
| `nif` | `CharField(max_length=9, unique=True)` | NIF for individuals, CIF for companies |
| `nombre` | `CharField(max_length=150)` | First name (física) or trade name (jurídica) |
| `apellidos` | `CharField(max_length=200, blank=True)` | Required when `tipo=FISICA` |
| `razon_social` | `CharField(max_length=200, blank=True)` | Required when `tipo=JURIDICA` |
| `email` | `EmailField` | |
| `telefono` | `CharField(max_length=20, blank=True)` | |
| `calle` | `CharField(max_length=255)` | |
| `codigo_postal` | `CharField(max_length=5)` | 5 digits only |
| `municipio` | `CharField(max_length=100)` | |
| `provincia` | `CharField(max_length=100)` | |
| `user` | `OneToOneField(User, null=True, blank=True, related_name="cliente_perfil")` | Linked user account for `role="cliente"` users |
| `created_by` | `ForeignKey(User, related_name="clientes_gestionados")` | Gestor who created this client |

### Conditional validation (in serializer)

- `tipo=FISICA` → `apellidos` required, `razon_social` ignored
- `tipo=JURIDICA` → `razon_social` required, `apellidos` ignored

## Serializers

**File:** `backend/apps/api/serializers/cliente.py`

Two serializers:

- **`ClienteWriteSerializer`** — used for `POST/PUT/PATCH` by gestores. All fields writable including the optional `user` FK (allows linking a client to an existing user account). Sets `created_by` from `request.user` in `perform_create`. Validates NIF format, `codigo_postal` (5 numeric digits), and conditional fields per `tipo`.
- **`ClienteGestorReadSerializer`** — used for `GET` by gestores. All fields including `created_by`, `user`, timestamps.
- **`ClienteReadSerializer`** — used for `GET` by clients. Contact and address fields only; no `created_by` or `user`.

## Viewset

**File:** `backend/apps/api/viewsets/cliente.py`

`ClienteViewSet(ModelViewSet)` with `IsAuthenticated` permission on all actions.

### `get_queryset()`

```python
if request.user.role == "gestor":
    return Cliente.objects.filter(created_by=request.user)
return Cliente.objects.filter(user=request.user)
```

Gestores only see clients they created. Clients only see their own record. A gestor cannot access another gestor's clients (returns 404).

### `get_serializer_class()`

```python
if request.user.role == "gestor":
    if self.action in ("list", "retrieve"):
        return ClienteGestorReadSerializer
    return ClienteWriteSerializer
return ClienteReadSerializer
```

### Action restrictions

`role="cliente"` users are denied `create`, `update`, `partial_update`, and `destroy` with `403 Forbidden`. Read-only access only.

### `perform_create()`

Sets `created_by=request.user` automatically.

## URL

Registered on the DRF router in `urls.py`:

```
GET     /v1/clientes/          → list
POST    /v1/clientes/          → create (gestor only)
GET     /v1/clientes/{id}/     → retrieve
PUT     /v1/clientes/{id}/     → update (gestor only, own clients)
PATCH   /v1/clientes/{id}/     → partial update (gestor only, own clients)
DELETE  /v1/clientes/{id}/     → destroy (gestor only, own clients)
```

## Admin

**File:** `backend/apps/api/admin/cliente.py`

`ClienteAdmin` registered with `list_display`, `list_filter` (by `tipo`, `provincia`), and `search_fields` (by `nif`, `nombre`, `razon_social`, `email`). Uses `all_objects` manager to include soft-deleted records.

## Tests

**File:** `backend/apps/api/tests/test_cliente.py`

Factory: `ClienteFactory` with both `tipo` variants via `factory.Trait`.

| Test | Description |
|---|---|
| Gestor lists only own clients | Returns only clients where `created_by=request.user` |
| Gestor cannot see another gestor's clients | `GET /v1/clientes/{id}/` returns 404 |
| Gestor can create a client | `POST` returns 201, sets `created_by` automatically |
| Gestor can update own client | `PUT/PATCH` returns 200 |
| Gestor can soft-delete own client | `DELETE` returns 204 |
| Cliente sees only own record | `GET /v1/clientes/` returns list with one item |
| Cliente cannot create | `POST` returns 403 |
| Cliente cannot update | `PUT/PATCH` returns 403 |
| Cliente cannot delete | `DELETE` returns 403 |
| NIF duplicate rejected | `POST` with existing NIF returns 400 |
| FISICA missing apellidos | `POST` with `tipo=FISICA` and no `apellidos` returns 400 |
| JURIDICA missing razon_social | `POST` with `tipo=JURIDICA` and no `razon_social` returns 400 |
| Unauthenticated request | `GET /v1/clientes/` returns 401 |
