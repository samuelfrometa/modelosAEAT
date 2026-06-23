from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.api.models import Cliente, User
from apps.api.serializers import (
    ClienteGestorReadSerializer,
    ClienteReadSerializer,
    ClienteWriteSerializer,
)


class ClienteViewSet(ModelViewSet):
    """CRUD endpoints for Cliente. Behaviour depends on the caller's role."""

    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return Cliente.objects.all()
        if user.role == User.Role.GESTOR:
            return Cliente.objects.filter(created_by=user)
        return Cliente.objects.filter(user=user)

    def get_serializer_class(self):
        user = self.request.user
        if user.role == User.Role.GESTOR:
            if self.action in ("list", "retrieve"):
                return ClienteGestorReadSerializer
            return ClienteWriteSerializer
        return ClienteReadSerializer

    def _require_gestor(self):
        if self.request.user.role != User.Role.GESTOR:
            raise PermissionDenied("Solo los gestores pueden realizar esta acción.")

    def create(self, request, *args, **kwargs):
        self._require_gestor()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._require_gestor()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._require_gestor()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._require_gestor()
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        Cliente.all_objects.filter(pk=instance.pk).update(deleted_at=timezone.now())
