from flask import Blueprint, request, jsonify
from app.core.extensions import db
from app.models.technician import Technician
from app.models.user import User
from app.schemas.technician import technician_schema, technicians_schema
from app.core.auth import hash_password

technicians_bp = Blueprint("technicians", __name__)
technicians_bp.strict_slashes = False


@technicians_bp.get("/")
def list_technicians():
    technicians = Technician.query.all()
    return jsonify(technicians_schema.dump(technicians)), 200


@technicians_bp.post("/")
def create_technician():
    data = request.get_json() or {}
    
    user = User(
        email=data.get("email", f"tech_{data.get('phone', '')}@sosc.local"),
        name=data.get("name", "Tecnico"),
        role="technician",
        password_hash=hash_password("123456"),
    )
    db.session.add(user)
    db.session.flush()
    
    technician = Technician(
        user_id=user.id,
        phone=data.get("phone"),
        zone=data.get("zone"),
        active=True,
    )
    db.session.add(technician)
    db.session.commit()
    
    return jsonify(technician_schema.dump(technician)), 201


@technicians_bp.get("/<int:technician_id>")
def get_technician(technician_id):
    technician = Technician.query.get_or_404(technician_id)
    return jsonify(technician_schema.dump(technician)), 200


@technicians_bp.put("/<int:technician_id>")
def update_technician(technician_id):
    technician = Technician.query.get_or_404(technician_id)
    data = request.get_json() or {}
    
    if "name" in data and technician.user:
        technician.user.name = data["name"]
    if "email" in data and technician.user:
        technician.user.email = data["email"]
    if "phone" in data:
        technician.phone = data["phone"]
    if "zone" in data:
        technician.zone = data["zone"]
    if "active" in data:
        technician.active = data["active"]
    
    db.session.commit()
    return jsonify(technician_schema.dump(technician)), 200


@technicians_bp.patch("/<int:technician_id>/toggle")
def toggle_technician(technician_id):
    technician = Technician.query.get_or_404(technician_id)
    technician.active = not technician.active
    db.session.commit()
    return jsonify(technician_schema.dump(technician)), 200


@technicians_bp.delete("/<int:technician_id>")
def delete_technician(technician_id):
    technician = Technician.query.get_or_404(technician_id)
    if technician.user:
        db.session.delete(technician.user)
    db.session.delete(technician)
    db.session.commit()
    return jsonify({"deleted": True}), 200
