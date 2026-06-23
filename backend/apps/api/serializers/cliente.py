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
