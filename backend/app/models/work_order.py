from datetime import datetime
from app.core.extensions import db


class WorkOrder(db.Model):
    __tablename__ = "work_orders"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text, nullable=True)
    requester = db.Column(db.String(120), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    report = db.Column(db.Text, nullable=True)
    ai_analysis = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default="open")
    priority = db.Column(db.String(50), nullable=False, default="medium")
    scheduled_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    technician_id = db.Column(db.Integer, db.ForeignKey("technicians.id"), nullable=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=True)

    technician = db.relationship("Technician", back_populates="work_orders")
    client = db.relationship("Client", back_populates="work_orders")
