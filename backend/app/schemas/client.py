from app.core.extensions import ma
from app.models.client import Client


class ClientSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Client
        load_instance = True


client_schema = ClientSchema()
clients_schema = ClientSchema(many=True)
