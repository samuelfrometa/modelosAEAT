from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.api.serializers.user import UserSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Issues access/refresh tokens enriched with user metadata."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["role"] = user.role
        token["full_name"] = user.get_full_name()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.is_superuser:
            raise serializers.ValidationError({"detail": "Superusers must log in through the Django admin."})
        data["user"] = UserSerializer(self.user).data
        return data
