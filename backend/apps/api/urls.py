from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.api.views import LoginView, MeView, RefreshTokenView, RegisterView
from apps.api.viewsets import ExampleViewSet

app_name = "api"

router = DefaultRouter()
# TODO: register your viewsets here
router.register("examples", ExampleViewSet, basename="example")

# Nested resource example (e.g. /examples/{example_pk}/items/):
# item_list = ItemViewSet.as_view({"get": "list", "post": "create"})
# item_detail = ItemViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"})

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("", include(router.urls)),
    # path("examples/<uuid:example_pk>/items/", item_list, name="example-items-list"),
    # path("examples/<uuid:example_pk>/items/<uuid:pk>/", item_detail, name="example-items-detail"),
]
