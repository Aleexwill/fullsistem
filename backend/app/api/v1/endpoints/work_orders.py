from flask import Blueprint, request, jsonify
from app.core.extensions import db
from app.models.work_order import WorkOrder
from app.schemas.work_order import work_order_schema, work_orders_schema

work_orders_bp = Blueprint("work_orders", __name__)
work_orders_bp.strict_slashes = False


@work_orders_bp.get("/")
def list_work_orders():
    orders = WorkOrder.query.order_by(WorkOrder.created_at.desc()).all()
    return jsonify(work_orders_schema.dump(orders)), 200


@work_orders_bp.get("/<int:order_id>")
def get_work_order(order_id):
    order = WorkOrder.query.get_or_404(order_id)
    return jsonify(work_order_schema.dump(order)), 200


@work_orders_bp.post("/")
def create_work_order():
    data = request.get_json() or {}
    
    for key in ["technician_id", "client_id"]:
        if key in data:
            if data[key] == "" or data[key] is None:
                data[key] = None
            else:
                data[key] = int(data[key])
    
    order = WorkOrder(
        title=data.get("title", ""),
        description=data.get("description"),
        requester=data.get("requester"),
        location=data.get("location"),
        status=data.get("status", "open"),
        priority=data.get("priority", "medium"),
        technician_id=data.get("technician_id"),
        client_id=data.get("client_id"),
    )
    db.session.add(order)
    db.session.commit()
    return jsonify(work_order_schema.dump(order)), 201


@work_orders_bp.put("/<int:order_id>")
def update_work_order(order_id):
    order = WorkOrder.query.get_or_404(order_id)
    data = request.get_json() or {}
    
    allowed = ["title", "description", "requester", "location", "report", "ai_analysis", 
               "status", "priority", "technician_id", "client_id", "scheduled_date"]
    
    for key, value in data.items():
        if key in allowed:
            if key in ["technician_id", "client_id"]:
                if value == "" or value is None:
                    value = None
                else:
                    value = int(value)
            setattr(order, key, value)
    
    db.session.commit()
    return jsonify(work_order_schema.dump(order)), 200


@work_orders_bp.delete("/<int:order_id>")
def delete_work_order(order_id):
    order = WorkOrder.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({"deleted": True}), 200
