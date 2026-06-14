from django.contrib import admin

from apps.api.models import Example


# TODO: rename to match your domain entity
@admin.register(Example)
class ExampleAdmin(admin.ModelAdmin):
    """Admin configuration for Example."""

    list_display = ("name", "active", "created_at")
    list_filter = ("active",)
    search_fields = ("name",)
    ordering = ("name",)
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")

    fieldsets = (
        (
            None,
            {"fields": ("name", "description")},
        ),
        (
            "Metadata",
            {
                "classes": ("collapse",),
                "fields": ("id", "active", "created_at", "updated_at", "deleted_at"),
            },
        ),
    )
