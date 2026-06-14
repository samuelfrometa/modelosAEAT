from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.api.models import Example
from apps.api.serializers import ExampleSerializer, ExampleWriteSerializer


# TODO: rename to match your domain entity
class ExampleViewSet(ModelViewSet):
    """CRUD endpoints for Example."""

    permission_classes = (IsAuthenticated,)
    queryset = Example.objects.all()
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ()          # TODO: add filterable FK fields, e.g. ("category",)
    search_fields = ("name",)      # TODO: add text-search fields
    ordering_fields = ("name", "created_at")
    ordering = ("name",)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ExampleWriteSerializer
        return ExampleSerializer

    # Override perform_create to inject request.user as owner:
    # def perform_create(self, serializer):
    #     serializer.save(owner=self.request.user)
