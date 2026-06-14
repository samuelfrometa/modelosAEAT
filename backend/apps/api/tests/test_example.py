import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.api.models import Example
from apps.api.tests.factories import ExampleFactory, UserFactory

LIST_URL = reverse("api:example-list")


def detail_url(pk) -> str:
    return reverse("api:example-detail", args=[pk])


def _auth(api_client: APIClient) -> APIClient:
    """Return api_client authenticated as a fresh user."""
    user = UserFactory()
    api_client.force_authenticate(user=user)
    return api_client


# ── Auth ──────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_list_requires_authentication(api_client: APIClient) -> None:
    response = api_client.get(LIST_URL)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ── List ──────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_list_returns_all_records(api_client: APIClient) -> None:
    ExampleFactory.create_batch(3)
    client = _auth(api_client)

    response = client.get(LIST_URL)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["count"] == 3


# ── Create ────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_create_valid_payload_returns_201(api_client: APIClient) -> None:
    client = _auth(api_client)

    response = client.post(LIST_URL, {"name": "New Example"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Example.objects.filter(name="New Example").exists()


@pytest.mark.django_db
def test_create_missing_required_fields_returns_400(api_client: APIClient) -> None:
    client = _auth(api_client)

    response = client.post(LIST_URL, {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ── Update ────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_partial_update_changes_name(api_client: APIClient) -> None:
    instance = ExampleFactory()
    client = _auth(api_client)

    response = client.patch(detail_url(instance.pk), {"name": "Updated"}, format="json")

    assert response.status_code == status.HTTP_200_OK
    instance.refresh_from_db()
    assert instance.name == "Updated"


# ── Delete ────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_delete_returns_204(api_client: APIClient) -> None:
    instance = ExampleFactory()
    client = _auth(api_client)

    response = client.delete(detail_url(instance.pk))

    assert response.status_code == status.HTTP_204_NO_CONTENT
