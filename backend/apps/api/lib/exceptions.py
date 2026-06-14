from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Wrap DRF errors in a stable envelope and avoid credential disclosure on auth failures."""
    response = exception_handler(exc, context)

    if response is None:
        return None

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return Response(
            {
                "error": {
                    "code": "authentication_failed",
                    "message": "Invalid credentials",
                }
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    detail = response.data
    code = getattr(exc, "default_code", "error")
    message = detail.get("detail") if isinstance(detail, dict) and "detail" in detail else "Request failed"

    return Response(
        {
            "error": {
                "code": code,
                "message": str(message),
                "details": detail,
            }
        },
        status=response.status_code,
    )
