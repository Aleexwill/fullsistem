from flask import Blueprint, request, jsonify
from app.core.extensions import db
from app.models.client import Client
from app.schemas.client import client_schema, clients_schema

clients_bp = Blueprint("clients", __name__)
clients_bp.strict_slashes = False


@clients_bp.get("/")
def list_clients():
    clients = Client.query.all()
    return jsonify(clients_schema.dump(clients)), 200


@clients_bp.get("/<int:client_id>")
def get_client(client_id):
    client = Client.query.get_or_404(client_id)
    return jsonify(client_schema.dump(client)), 200


@clients_bp.post("/")
def create_client():
    data = request.get_json() or {}
    client = Client(
        name=data.get("name", ""),
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("address"),
    )
    db.session.add(client)
    db.session.commit()
    return jsonify(client_schema.dump(client)), 201


@clients_bp.put("/<int:client_id>")
def update_client(client_id):
    client = Client.query.get_or_404(client_id)
    data = request.get_json() or {}
    
    for key in ["name", "email", "phone", "address"]:
        if key in data:
            setattr(client, key, data[key])
    
    db.session.commit()
    return jsonify(client_schema.dump(client)), 200


@clients_bp.delete("/<int:client_id>")
def delete_client(client_id):
    client = Client.query.get_or_404(client_id)
    db.session.delete(client)
    db.session.commit()
    return jsonify({"deleted": True}), 200
