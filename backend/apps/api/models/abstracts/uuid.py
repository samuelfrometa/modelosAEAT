import uuid

from django.db import models


class UUIDPrimaryKeyModel(models.Model):
    """Abstract base that replaces the default BigAutoField id with a UUID primary key."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True
