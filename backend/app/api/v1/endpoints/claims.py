from flask import Blueprint, request, jsonify
from app.core.extensions import db
from app.models.claim import Claim
from app.schemas.claim import claim_schema, claims_schema
from datetime import datetime

claims_bp = Blueprint("claims", __name__)
claims_bp.strict_slashes = False


def parse_date(date_str):
    if not date_str or date_str == "":
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except:
        return None


@claims_bp.get("/")
def list_claims():
    claims = Claim.query.order_by(Claim.created_at.desc()).all()
    return jsonify(claims_schema.dump(claims)), 200


@claims_bp.get("/<int:claim_id>")
def get_claim(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    return jsonify(claim_schema.dump(claim)), 200


@claims_bp.post("/")
def create_claim():
    data = request.get_json() or {}
    
    for key in ["work_order_id", "client_id"]:
        if key in data:
            if data[key] == "" or data[key] is None:
                data[key] = None
            else:
                data[key] = int(data[key])
    
    warranty_months = data.get("warranty_months")
    if warranty_months == "" or warranty_months is None:
        warranty_months = None
    else:
        warranty_months = int(warranty_months)
    
    claim = Claim(
        title=data.get("title", ""),
        description=data.get("description", ""),
        type=data.get("type", "reclamo"),
        status=data.get("status", "open"),
        priority=data.get("priority", "medium"),
        work_order_id=data.get("work_order_id"),
        client_id=data.get("client_id"),
        warranty_start=parse_date(data.get("warranty_start")),
        warranty_end=parse_date(data.get("warranty_end")),
        warranty_months=warranty_months,
        warranty_conditions=data.get("warranty_conditions"),
        warranty_coverage=data.get("warranty_coverage"),
        product_serial=data.get("product_serial"),
    )
    db.session.add(claim)
    db.session.commit()
    return jsonify(claim_schema.dump(claim)), 201


@claims_bp.put("/<int:claim_id>")
def update_claim(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    data = request.get_json() or {}
    
    allowed = ["title", "description", "type", "status", "priority", "resolution",
               "work_order_id", "client_id", "warranty_start", "warranty_end",
               "warranty_months", "warranty_conditions", "warranty_coverage", "product_serial"]
    
    for key, value in data.items():
        if key in allowed:
            if key in ["work_order_id", "client_id"]:
                if value == "" or value is None:
                    value = None
                else:
                    value = int(value)
            elif key == "warranty_months":
                if value == "" or value is None:
                    value = None
                else:
                    value = int(value)
            elif key in ["warranty_start", "warranty_end"]:
                value = parse_date(value)
            setattr(claim, key, value)
    
    if data.get("status") in ["resolved", "closed"] and not claim.resolved_at:
        claim.resolved_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(claim_schema.dump(claim)), 200


@claims_bp.delete("/<int:claim_id>")
def delete_claim(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    db.session.delete(claim)
    db.session.commit()
    return jsonify({"deleted": True}), 200
