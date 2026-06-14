from django.db import models

from apps.api.models.abstracts import BaseModel


# TODO: rename this file and class to match your domain entity
class Example(BaseModel):
    """Template domain model. Rename to your entity."""

    name = models.CharField(max_length=255, verbose_name="nombre")
    description = models.TextField(blank=True, verbose_name="descripción")
    # FK example — use PROTECT for lookup tables, SET_NULL for optional relations
    # owner = models.ForeignKey(
    #     "api.User",
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     related_name="examples",
    #     verbose_name="propietario",
    # )

    class Meta(BaseModel.Meta):
        verbose_name = "ejemplo"
        verbose_name_plural = "ejemplos"

    def __str__(self) -> str:
        return self.name
