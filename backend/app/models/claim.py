from app.core.extensions import db
from datetime import datetime


class Claim(db.Model):
    __tablename__ = "claims"

    id = db.Column(db.Integer, primary_key=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey("work_orders.id"), nullable=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=True)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    type = db.Column(db.String(50), nullable=False, default="reclamo")
    status = db.Column(db.String(50), nullable=False, default="open")
    priority = db.Column(db.String(20), nullable=False, default="medium")
    resolution = db.Column(db.Text, nullable=True)
    
    warranty_start = db.Column(db.Date, nullable=True)
    warranty_end = db.Column(db.Date, nullable=True)
    warranty_months = db.Column(db.Integer, nullable=True)
    warranty_conditions = db.Column(db.Text, nullable=True)
    warranty_coverage = db.Column(db.String(100), nullable=True)
    product_serial = db.Column(db.String(100), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    work_order = db.relationship("WorkOrder", backref="claims")
    client = db.relationship("Client", backref="claims")
