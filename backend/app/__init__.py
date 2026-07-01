from flask import Flask
from flask_cors import CORS

from app.core.config import Config
from app.core.extensions import db, ma


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config())

    CORS(app)

    db.init_app(app)
    ma.init_app(app)

    with app.app_context():
        # Importar modelos primero
        from app.models import User, Client, Technician, WorkOrder, Claim
        db.create_all()
        
        # Luego registrar blueprints
        from app.api.v1 import api_v1_bp
        app.register_blueprint(api_v1_bp, url_prefix="/api/v1")

    return app
