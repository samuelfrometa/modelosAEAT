from django.db import models


class ActiveManager(models.Manager):
    """
    Default manager that restricts querysets to live records only.

    A record is considered live when both conditions hold:
      - deleted_at is NULL  (not soft-deleted)
      - active is True      (not soft-disabled)
    """

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset().filter(deleted_at__isnull=True, active=True)
