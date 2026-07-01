from app.core.extensions import ma
from app.models.technician import Technician


class TechnicianSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Technician
        load_instance = True
        include_fk = True

    name = ma.Method("get_name")
    email = ma.Method("get_email")

    def get_name(self, obj):
        return obj.user.name if obj.user else None

    def get_email(self, obj):
        return obj.user.email if obj.user else None


technician_schema = TechnicianSchema()
technicians_schema = TechnicianSchema(many=True)
