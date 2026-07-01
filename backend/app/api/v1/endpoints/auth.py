from flask import Blueprint, request, jsonify
from app.core.extensions import db
from app.models.user import User
from app.schemas.user import user_schema
from app.core.auth import hash_password, check_password, generate_token, token_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    
    if User.query.filter_by(email=data.get("email")).first():
        return jsonify({"error": "Email ya registrado"}), 400
    
    user = User(
        email=data.get("email"),
        name=data.get("name", ""),
        role=data.get("role", "user"),
        password_hash=hash_password(data.get("password", "123456")),
    )
    db.session.add(user)
    db.session.commit()
    
    token = generate_token(user.id, user.role)
    return jsonify({"user": user_schema.dump(user), "token": token}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    user = User.query.filter_by(email=data.get("email")).first()
    
    if not user or not user.password_hash:
        return jsonify({"error": "Credenciales invalidas"}), 401
    
    if not check_password(data.get("password", ""), user.password_hash):
        return jsonify({"error": "Credenciales invalidas"}), 401
    
    token = generate_token(user.id, user.role)
    return jsonify({"user": user_schema.dump(user), "token": token}), 200


@auth_bp.get("/me")
@token_required
def me():
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(user_schema.dump(user)), 200
