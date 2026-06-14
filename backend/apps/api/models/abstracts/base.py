from django.db import models

from .managers import ActiveManager
from .uuid import UUIDPrimaryKeyModel


class BaseModel(UUIDPrimaryKeyModel):
    """
    Abstract base for all concrete domain models.

    Provides:
      - UUID primary key (via UUIDPrimaryKeyModel)
      - created_at / updated_at timestamps
      - deleted_at for soft-delete (NULL means not deleted)
      - active flag for soft-disable (False means disabled)
      - objects = ActiveManager() — default manager, hides soft-deleted/disabled records
      - all_objects = Manager() — unfiltered manager for admin and internal use
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    active = models.BooleanField(default=True, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta(UUIDPrimaryKeyModel.Meta):
        abstract = True
        ordering = ["-created_at"]
