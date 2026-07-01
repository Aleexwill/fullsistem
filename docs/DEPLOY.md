# Despliegue de SOSC en un VPS

Guía paso a paso para correr SOSC en un VPS Linux (Ubuntu 22.04+ recomendado),
detrás de un proxy con HTTPS automático (Caddy o Traefik).

## Tabla de contenido

1. [Requisitos del VPS](#1-requisitos-del-vps)
2. [Preparación inicial del servidor](#2-preparación-inicial-del-servidor)
3. [Instalar Docker y Docker Compose](#3-instalar-docker-y-docker-compose)
4. [Clonar el repo](#4-clonar-el-repo)
5. [Variables de entorno](#5-variables-de-entorno)
6. [DNS y dominio](#6-dns-y-dominio)
7. [Reverse proxy con HTTPS (Caddy)](#7-reverse-proxy-con-https-caddy)
8. [Primer deploy](#8-primer-deploy)
9. [Despliegues posteriores](#9-despliegues-posteriores)
10. [Backups](#10-backups)
11. [Logs y monitoreo](#11-logs-y-monitoreo)
12. [Troubleshooting](#12-troubleshooting)
13. [Auto-deploy desde GitHub (opcional)](#13-auto-deploy-desde-github-opcional)

---

## 1. Requisitos del VPS

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Disco | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Puertos abiertos | 22, 80, 443 | + 9001 (consola MinIO) opcional |

Proveedores que funcionan bien por precio/calidad: Hetzner, DigitalOcean, Vultr, OVH.

---

## 2. Preparación inicial del servidor

Conectate por SSH como `root` y creá un usuario `sosc` con sudo:

```bash
ssh root@TU_IP

adduser sosc
usermod -aG sudo sosc
rsync --archive --chown=sosc:sosc ~/.ssh /home/sosc

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

apt update && apt -y upgrade
apt -y install git curl ca-certificates gnupg unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades

# Deshabilitar login root por SSH (opcional pero recomendado)
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl reload ssh

logout
```

A partir de ahora trabajá como `sosc`:

```bash
ssh sosc@TU_IP
```

---

## 3. Instalar Docker y Docker Compose

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update
sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker

docker --version
docker compose version
```

---

## 4. Clonar el repo

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/riverosgr-dotcom/fullsistem.git sosc
cd sosc
```

> Si el repo es **privado**, generá un Personal Access Token en GitHub
> (`Settings → Developer settings → Personal access tokens`, scope `repo`)
> y usalo como password cuando git lo pida. Lo guarda Git Credential Manager
> o el `credential.helper store`.

---

## 5. Variables de entorno

```bash
cp .env.production.example .env.production
nano .env.production
```

**Generá secretos fuertes** (una vez por cada `CAMBIAR-*`):

```bash
openssl rand -hex 32
```

Llená:
- `SECRET_KEY` y `JWT_SECRET_KEY` (32 bytes hex cada uno).
- `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `MINIO_ROOT_PASSWORD` (passwords largas).
- `FRONTEND_URL` y `CORS_ORIGINS` con tu dominio real (`https://app.tu-dominio.com`).
- API keys externas si las usás (`OPENAI_API_KEY`, etc.).

> El archivo `.env.production` está en `.gitignore`. **Nunca lo commitees.**

---

## 6. DNS y dominio

En tu proveedor de DNS, creá un registro A:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | `app` (o `@`) | IP del VPS | 3600 |

Esperá unos minutos a que propague:

```bash
dig +short app.tu-dominio.com
```

Tiene que devolver la IP del VPS.

---

## 7. Reverse proxy con HTTPS (Caddy)

El stack expone el frontend en el puerto 80 del host. Para HTTPS automático
con Let's Encrypt usamos **Caddy** delante (es la opción más simple).

Instalación:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Editá `/etc/caddy/Caddyfile`:

```caddyfile
app.tu-dominio.com {
    encode gzip zstd

    @api path /api/* /api
    handle @api {
        reverse_proxy localhost:80
    }

    handle {
        reverse_proxy localhost:80
    }

    log {
        output file /var/log/caddy/access.log
    }
}
```

Y reiniciá:

```bash
sudo systemctl reload caddy
```

Caddy obtiene el certificado HTTPS automáticamente y renueva solo.

> **Alternativa con Traefik o Nginx + Certbot**: ver sección final.

---

## 8. Primer deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

El script:
1. Hace `git fetch` + `reset --hard origin/main`.
2. Construye las imágenes (`docker compose build`).
3. Levanta el stack completo (`up -d`).
4. Espera al healthcheck del backend.
5. Aplica migraciones (`flask db upgrade`).
6. Limpia imágenes huérfanas.

Verificá:

```bash
docker compose -f docker-compose.prod.yml ps
curl https://app.tu-dominio.com/api/v1/health
```

Si todo está OK, abrí en el navegador `https://app.tu-dominio.com` 🎉

---

## 9. Despliegues posteriores

Cada vez que querés actualizar:

```bash
cd ~/apps/sosc
./deploy.sh
```

Flags útiles:
- `./deploy.sh --no-pull` → no actualiza el código, solo rebuilds
- `./deploy.sh --no-build` → no rebuildea, solo restartea
- `./deploy.sh --no-migrate` → no aplica migraciones

---

## 10. Backups

El script ya hace backup automático de la DB en cada deploy (en `./backups/`,
mantiene los últimos 14).

Para backup manual:

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip > backups/db_$(date +%Y%m%d_%H%M%S).sql.gz
```

Para restaurar:

```bash
gunzip -c backups/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

**Backup off-site recomendado**: configurá un cron que suba `./backups/` a
un bucket S3/MinIO/Backblaze cada noche.

---

## 11. Logs y monitoreo

```bash
docker compose -f docker-compose.prod.yml logs -f                 # todo
docker compose -f docker-compose.prod.yml logs -f backend         # solo backend
docker compose -f docker-compose.prod.yml logs --tail=200 frontend
docker stats                                                       # uso de CPU/RAM en vivo
```

Healthchecks definidos:
- `backend` → `/api/v1/health` cada 30s
- `frontend` → `GET /` cada 30s
- `postgres` → `pg_isready` cada 10s
- `redis` → `PING` cada 10s
- `minio` → `/minio/health/live` cada 30s

```bash
docker inspect --format='{{json .State.Health}}' sosc_backend_prod | jq
```

---

## 12. Troubleshooting

| Síntoma | Solución |
|---------|----------|
| `502 Bad Gateway` desde Caddy | El backend o frontend no está levantado. `docker compose ps` y `logs`. |
| El frontend carga pero `/api/*` da 404 | El proxy de nginx interno no encuentra `backend`. Verificá que ambos estén en la red `sosc_public`. |
| `permission denied` ejecutando `deploy.sh` | `chmod +x deploy.sh` |
| Migraciones fallan | Entrá manualmente: `docker compose exec backend flask db upgrade`. Revisá logs del backend. |
| Disco lleno | `docker system prune -af --volumes` (cuidado con volúmenes activos). |
| Cambiaste secrets en `.env.production` y no toman efecto | `docker compose down && docker compose up -d` (restart no relee env). |

---

## 13. Auto-deploy desde GitHub (opcional)

En el repo está preparado el workflow `.github/workflows/deploy.yml`
(deshabilitado por defecto). Para activarlo:

1. En el VPS, generá una clave SSH dedicada para deploy:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/sosc_deploy -N ''
   cat ~/.ssh/sosc_deploy.pub >> ~/.ssh/authorized_keys
   ```

2. En GitHub → repo → **Settings → Secrets and variables → Actions**, agregá:
   - `VPS_HOST`: IP o dominio del VPS
   - `VPS_USER`: `sosc`
   - `VPS_SSH_KEY`: contenido completo de `~/.ssh/sosc_deploy` (la privada)
   - `VPS_PORT`: `22` (o el que uses)

3. En `.github/workflows/deploy.yml` quitá el comentario del trigger
   `on: push` (o ajustá las condiciones).

Cada push a `main` va a:
- Esperar a que pase el CI.
- Conectarse por SSH al VPS.
- Ejecutar `~/apps/sosc/deploy.sh`.

---

## Apéndice: alternativa sin Caddy (Nginx + Certbot)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/sosc
```

```nginx
server {
    listen 80;
    server_name app.tu-dominio.com;
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sosc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d app.tu-dominio.com
```

Pero hay un conflicto de puerto: si usás Nginx host, cambiá en
`docker-compose.prod.yml` el mapping del frontend de `80:80` a `8080:80` y
ajustá el `proxy_pass` a `http://127.0.0.1:8080;`.
