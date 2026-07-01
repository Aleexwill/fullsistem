#!/usr/bin/env bash
# =====================================================================
# SOSC - Script de deploy en VPS
# Uso: ./deploy.sh [--no-pull] [--no-build] [--no-migrate]
# =====================================================================
# Requisitos en el VPS:
#   - Docker Engine 24+ y Docker Compose v2 (`docker compose ...`)
#   - .env.production presente en el directorio actual
#   - Repo clonado (este script vive en la raiz del repo)
# =====================================================================

set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

DO_PULL=true
DO_BUILD=true
DO_MIGRATE=true

for arg in "$@"; do
    case $arg in
        --no-pull)    DO_PULL=false ;;
        --no-build)   DO_BUILD=false ;;
        --no-migrate) DO_MIGRATE=false ;;
        -h|--help)
            echo "Uso: $0 [--no-pull] [--no-build] [--no-migrate]"
            exit 0
            ;;
        *)
            echo "Argumento desconocido: $arg" >&2
            exit 1
            ;;
    esac
done

log() { echo -e "\033[1;36m[deploy]\033[0m $*"; }
err() { echo -e "\033[1;31m[error]\033[0m  $*" >&2; }

# --- Pre-checks ---
[[ -f "$ENV_FILE" ]] || { err "Falta $ENV_FILE en $(pwd). Copialo desde .env.production.example y completalo."; exit 1; }
command -v docker >/dev/null || { err "Docker no esta instalado."; exit 1; }
docker compose version >/dev/null 2>&1 || { err "Docker Compose v2 no esta disponible (usar 'docker compose', no 'docker-compose')."; exit 1; }

# --- Pull del codigo ---
if $DO_PULL; then
    log "Actualizando codigo desde origin/main..."
    git fetch --all
    git reset --hard origin/main
fi

# --- Backup rapido de la DB antes de cualquier cambio ---
if docker compose -f "$COMPOSE_FILE" ps postgres --status running --quiet 2>/dev/null | grep -q .; then
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    STAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_${STAMP}.sql.gz"
    log "Backup de DB -> $BACKUP_FILE"
    # shellcheck disable=SC2046
    docker compose -f "$COMPOSE_FILE" exec -T postgres sh -c \
        'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
        | gzip > "$BACKUP_FILE" || log "(omitiendo backup, primer deploy?)"

    # Mantener solo los ultimos 14 backups
    ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
fi

# --- Build de las imagenes ---
if $DO_BUILD; then
    log "Construyendo imagenes Docker..."
    docker compose -f "$COMPOSE_FILE" build --pull
fi

# --- Levantar servicios ---
log "Levantando stack..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

# --- Migraciones ---
if $DO_MIGRATE; then
    log "Esperando a que el backend este saludable..."
    for i in {1..30}; do
        if docker compose -f "$COMPOSE_FILE" exec -T backend curl -fsS http://localhost:5000/api/v1/health >/dev/null 2>&1; then
            break
        fi
        sleep 2
    done

    log "Aplicando migraciones (flask db upgrade)..."
    docker compose -f "$COMPOSE_FILE" exec -T backend sh -c 'flask db upgrade || true'
fi

# --- Limpieza ---
log "Limpiando imagenes huerfanas..."
docker image prune -f >/dev/null

# --- Resumen ---
log "Deploy completo. Estado:"
docker compose -f "$COMPOSE_FILE" ps

log "Logs en vivo: docker compose -f $COMPOSE_FILE logs -f"
