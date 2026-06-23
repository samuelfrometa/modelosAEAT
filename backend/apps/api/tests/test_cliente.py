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
    assert "nif" in response.data["error"]["details"]


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
    assert "apellidos" in response.data["error"]["details"]


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
    assert "razon_social" in response.data["error"]["details"]


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
    assert "codigo_postal" in response.data["error"]["details"]


# ── Auth ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_unauthenticated_request_rejected(api_client):
    response = api_client.get(URL_LIST)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
