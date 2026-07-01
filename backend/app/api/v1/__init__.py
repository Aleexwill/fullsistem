from flask import Blueprint

from app.api.v1.endpoints.health import health_bp
from app.api.v1.endpoints.auth import auth_bp
from app.api.v1.endpoints.technicians import technicians_bp
from app.api.v1.endpoints.work_orders import work_orders_bp
from app.api.v1.endpoints.clients import clients_bp
from app.api.v1.endpoints.ai import ai_bp
from app.api.v1.endpoints.claims import claims_bp


api_v1_bp = Blueprint("api_v1", __name__)
api_v1_bp.register_blueprint(health_bp)
api_v1_bp.register_blueprint(auth_bp, url_prefix="/auth")
api_v1_bp.register_blueprint(technicians_bp, url_prefix="/technicians")
api_v1_bp.register_blueprint(work_orders_bp, url_prefix="/work-orders")
api_v1_bp.register_blueprint(clients_bp, url_prefix="/clients")
api_v1_bp.register_blueprint(ai_bp, url_prefix="/ai")
api_v1_bp.register_blueprint(claims_bp, url_prefix="/claims")
