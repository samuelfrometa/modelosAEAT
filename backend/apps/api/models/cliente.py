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
