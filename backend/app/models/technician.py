from datetime import datetime
from app.core.extensions import db


class Technician(db.Model):
    __tablename__ = "technicians"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    zone = db.Column(db.String(100), nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref="technician")
    work_orders = db.relationship("WorkOrder", back_populates="technician")

    def __repr__(self):
        return f"<Technician {self.id}>"
