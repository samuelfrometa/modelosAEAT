from django.contrib import admin

from apps.api.models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    """Admin configuration for Cliente."""

    list_display = ("nif", "nombre", "tipo", "provincia", "active", "created_at")
    list_filter = ("tipo", "provincia", "active")
    search_fields = ("nif", "nombre", "razon_social", "email")
    ordering = ("nombre",)
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")

    def get_queryset(self, request):
        return Cliente.all_objects.all()

    fieldsets = (
        (
            "Identificación",
            {"fields": ("tipo", "nif", "nombre", "apellidos", "razon_social")},
        ),
        (
            "Contacto",
            {"fields": ("email", "telefono")},
        ),
        (
            "Dirección fiscal",
            {"fields": ("calle", "codigo_postal", "municipio", "provincia")},
        ),
        (
            "Relaciones",
            {"fields": ("user", "created_by")},
        ),
        (
            "Metadata",
            {
                "classes": ("collapse",),
                "fields": ("id", "active", "created_at", "updated_at", "deleted_at"),
            },
        ),
    )
