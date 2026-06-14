from rest_framework import serializers

from apps.api.models import Example


# TODO: rename to match your domain entity
class ExampleSerializer(serializers.ModelSerializer):
    """Read representation of Example."""

    class Meta:
        model = Example
        fields = ("id", "name", "description", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ExampleWriteSerializer(serializers.ModelSerializer):
    """Write serializer for creating and updating Example instances."""

    class Meta:
        model = Example
        fields = ("name", "description")
