from flask import Blueprint, request, jsonify

ai_bp = Blueprint("ai", __name__)
ai_bp.strict_slashes = False


@ai_bp.post("/chat")
def chat_with_ai():
    data = request.get_json() or {}
    message = data.get("message", "")
    context = data.get("context", {})
    
    if not message:
        return jsonify({"error": "No hay mensaje"}), 400
    
    response = generate_chat_response(message, context)
    return jsonify({"response": response}), 200


@ai_bp.post("/analyze")
def analyze_report():
    data = request.get_json() or {}
    report = data.get("report", "")
    title = data.get("title", "")
    description = data.get("description", "")
    
    if not report:
        return jsonify({"error": "No hay informe para analizar"}), 400
    
    analysis = generate_analysis(title, description, report)
    return jsonify({"analysis": analysis}), 200


def detect_problem_type(text):
    text = text.lower()
    if any(w in text for w in ["electrico", "cable", "voltaje", "enchufe", "corriente"]):
        return "electrico"
    elif any(w in text for w in ["agua", "fuga", "cañeria", "plomeria", "goteo"]):
        return "plomeria"
    elif any(w in text for w in ["motor", "maquina", "mecanico", "ruido"]):
        return "mecanico"
    elif any(w in text for w in ["aire", "clima", "temperatura", "ventilacion"]):
        return "climatizacion"
    return "general"


def generate_chat_response(message, context):
    msg_lower = message.lower()
    title = context.get("title", "")
    description = context.get("description", "")
    report = context.get("report", "")
    
    if any(w in msg_lower for w in ["material", "herramienta", "necesito"]):
        return suggest_materials(title, description, report)
    elif any(w in msg_lower for w in ["tiempo", "duracion", "cuanto tarda"]):
        return estimate_time(title, description, report)
    elif any(w in msg_lower for w in ["precio", "costo", "presupuesto"]):
        return estimate_cost(title, description, report)
    elif any(w in msg_lower for w in ["paso", "procedimiento", "como"]):
        return suggest_procedure(title, description, report)
    elif any(w in msg_lower for w in ["peligro", "riesgo", "seguridad"]):
        return suggest_safety(title, description, report)
    else:
        return f"""Puedo ayudarte con:
- Materiales/herramientas - Pregunta: "Que materiales necesito?"
- Tiempo estimado - Pregunta: "Cuanto tiempo tardara?"
- Costos - Pregunta: "Cual es el costo aproximado?"
- Procedimiento - Pregunta: "Como debo resolver esto?"
- Seguridad - Pregunta: "Que precauciones debo tomar?" """


def suggest_materials(title, description, report):
    problem = detect_problem_type(f"{title} {description} {report}")
    materials = {
        "electrico": ["Multimetro", "Destornillador aislado", "Cinta aisladora", "Cables de repuesto"],
        "plomeria": ["Llave stillson", "Cinta teflon", "Sellador", "Juntas de goma"],
        "mecanico": ["Juego de llaves", "Aceite lubricante", "Grasa", "Destornilladores"],
        "climatizacion": ["Filtros de repuesto", "Manometros", "Gas refrigerante"],
        "general": ["Caja de herramientas basica", "Linterna", "Cinta metrica"]
    }
    items = materials.get(problem, materials["general"])
    return f"**Materiales sugeridos ({problem}):**\n" + "\n".join([f"- {m}" for m in items])


def estimate_time(title, description, report):
    problem = detect_problem_type(f"{title} {description} {report}")
    times = {"electrico": "1-3 horas", "plomeria": "2-4 horas", "mecanico": "2-6 horas", 
             "climatizacion": "1-2 horas", "general": "1-4 horas"}
    return f"**Tiempo estimado:** {times.get(problem, '1-4 horas')}\nTipo: {problem.upper()}"


def estimate_cost(title, description, report):
    problem = detect_problem_type(f"{title} {description} {report}")
    costs = {"electrico": "$15.000 - $45.000", "plomeria": "$12.000 - $35.000", 
             "mecanico": "$20.000 - $60.000", "climatizacion": "$18.000 - $50.000", 
             "general": "$10.000 - $30.000"}
    return f"**Costo estimado:** {costs.get(problem, '$10.000 - $30.000')}\nTipo: {problem.upper()}"


def suggest_procedure(title, description, report):
    problem = detect_problem_type(f"{title} {description} {report}")
    procedures = {
        "electrico": ["1. Cortar suministro electrico", "2. Verificar ausencia de tension", 
                      "3. Inspeccionar cables", "4. Reparar/reemplazar", "5. Probar"],
        "plomeria": ["1. Cerrar llave de paso", "2. Drenar agua", "3. Localizar fuga", 
                     "4. Reparar", "5. Verificar"],
        "general": ["1. Evaluar situacion", "2. Identificar problema", "3. Reparar", "4. Verificar"]
    }
    pasos = procedures.get(problem, procedures["general"])
    return f"**Procedimiento ({problem}):**\n" + "\n".join(pasos)


def suggest_safety(title, description, report):
    problem = detect_problem_type(f"{title} {description} {report}")
    safety = {
        "electrico": ["Cortar energia", "Usar herramientas aisladas", "Verificar ausencia de tension"],
        "plomeria": ["Cerrar llaves de paso", "Cuidado con superficies resbaladizas"],
        "general": ["Usar EPP adecuado", "Mantener area despejada"]
    }
    items = safety.get(problem, safety["general"])
    return f"**Precauciones ({problem}):**\n" + "\n".join([f"- {s}" for s in items])


def generate_analysis(title, description, report):
    text = f"{title} {description} {report}".lower()
    problem = detect_problem_type(text)
    
    lines = ["## ANALISIS DEL CASO", "", f"**Tipo detectado:** {problem.upper()}", "",
             "### Recomendaciones"]
    
    if problem == "electrico":
        lines.extend(["- Verificar tablero electrico", "- Revisar cables", "- Medir tension"])
    elif problem == "plomeria":
        lines.extend(["- Cerrar llave de paso", "- Verificar presion", "- Revisar juntas"])
    else:
        lines.extend(["- Inspeccion visual", "- Documentar hallazgos"])
    
    lines.extend(["", "---", "*Analisis generado automaticamente*"])
    return "\n".join(lines)
