from rest_framework import serializers

from apps.api.models import User


class UserSerializer(serializers.ModelSerializer):
    """Read representation of the authenticated user."""

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone", "role")
        read_only_fields = fields
