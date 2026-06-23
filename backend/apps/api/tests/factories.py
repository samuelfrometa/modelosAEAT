import factory
from factory.django import DjangoModelFactory

from apps.api.models import Cliente, Example, User


class UserFactory(DjangoModelFactory):
    """
    Factory for User model instances.

    Overrides _create to call User.objects.create_user so the password is
    properly hashed via set_password rather than stored in plain text.

    Default password: "Testpass123!"

    Available traits:
      - superuser: sets is_superuser=True, is_staff=True, role=ADMIN
      - inactive:  sets is_active=False
    """

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    role = User.Role.ADMIN
    password = "Testpass123!"

    class Meta:
        model = User
        exclude = ["password"]

    class Params:
        superuser = factory.Trait(
            is_superuser=True,
            is_staff=True,
            role=User.Role.ADMIN,
        )
        inactive = factory.Trait(
            is_active=False,
        )
        gestor = factory.Trait(
            role=User.Role.GESTOR,
        )
        cliente = factory.Trait(
            role=User.Role.CLIENTE,
        )

    @classmethod
    def _create(cls, model_class: type, *args, **kwargs) -> User:
        password = kwargs.pop("password", "Testpass123!")
        return model_class.objects.create_user(*args, password=password, **kwargs)


# TODO: add a factory for each domain model
class ExampleFactory(DjangoModelFactory):
    """Factory for Example model instances."""

    name = factory.Sequence(lambda n: f"Example {n}")
    description = factory.Faker("sentence")

    class Meta:
        model = Example


class ClienteFactory(DjangoModelFactory):
    """Factory for Cliente model instances. Default tipo: FISICA."""

    tipo = Cliente.Tipo.FISICA
    nif = factory.Sequence(lambda n: f"{n:08d}A")
    nombre = factory.Faker("first_name", locale="es_ES")
    apellidos = factory.Faker("last_name", locale="es_ES")
    razon_social = ""
    email = factory.Faker("email")
    telefono = ""
    calle = factory.Faker("street_address", locale="es_ES")
    codigo_postal = "28001"
    municipio = "Madrid"
    provincia = "Madrid"
    user = None
    created_by = factory.SubFactory(UserFactory, gestor=True)

    class Meta:
        model = Cliente

    class Params:
        juridica = factory.Trait(
            tipo=Cliente.Tipo.JURIDICA,
            apellidos="",
            razon_social=factory.Faker("company"),
            nif=factory.Sequence(lambda n: f"B{n:07d}0"),
        )
