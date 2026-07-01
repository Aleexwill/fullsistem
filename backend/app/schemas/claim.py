from app.core.extensions import ma
from app.models.claim import Claim


class ClaimSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Claim
        load_instance = True
        include_fk = True


claim_schema = ClaimSchema()
claims_schema = ClaimSchema(many=True)
