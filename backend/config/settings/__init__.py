from decouple import config
from importlib import import_module
import sys

environment = config("DJANGO_ENVIRONMENT", default="development")

module = import_module(f"config.settings.{environment}")
sys.modules[__name__].__dict__.update(
    {k: v for k, v in module.__dict__.items() if not k.startswith("__")}
)
