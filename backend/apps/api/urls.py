from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.api.views import LoginView, MeView, RefreshTokenView, RegisterView
from apps.api.viewsets import ClienteViewSet, ExampleViewSet

app_name = "api"

router = DefaultRouter()
router.register("examples", ExampleViewSet, basename="example")
router.register("clientes", ClienteViewSet, basename="cliente")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("", include(router.urls)),
]
