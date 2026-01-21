#!/bin/bash
set -e  # Exit on any error

# ============================================
# PRO-SOLUTIONS INVENTARIO - Deploy to N5 Pro
# MacBook → GitHub → N5 Pro (Windows 11 + Docker)
# ============================================

# --- CONFIGURACIÓN DEL N5 PRO ---
REMOTE_USER="dgali"
# IP de Tailscale del N5 (fija)
REMOTE_HOST="100.106.83.19"
# Carpeta en el N5
REMOTE_DIR="/d/Projectos/prosolutions_inventario_web"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   PRO-SOLUTIONS INVENTARIO${NC}"
echo -e "${CYAN}   Deploy: Mac → GitHub → N5 Pro${NC}"
echo -e "${CYAN}========================================${NC}"

# --- PASO 1: Subir a GitHub ---
echo -e "${BLUE}>>> [MAC] Guardando y subiendo cambios a GitHub...${NC}"

# Verificar si hay cambios
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${YELLOW}No hay cambios para commitear${NC}"
else
    git add .
    git commit -m "deploy: update from Mac $(date '+%Y-%m-%d %H:%M')" || true
fi

# Push con la rama actual
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Pushing to ${CURRENT_BRANCH}...${NC}"
git push origin "$CURRENT_BRANCH"

# --- PASO 2: Deploy en N5 ---
echo -e "${BLUE}>>> [N5 PRO] Conectando vía Tailscale a ${REMOTE_HOST}...${NC}"

# Verificar conexión primero
if ! ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'Conexión OK'"; then
    echo -e "${RED}Error: No se puede conectar al N5 Pro${NC}"
    echo -e "${YELLOW}Verifica que:${NC}"
    echo "  1. Tailscale está activo en el N5"
    echo "  2. SSH está habilitado en Windows"
    echo "  3. La IP ${REMOTE_HOST} es correcta"
    exit 1
fi

echo -e "${GREEN}>>> Actualizando código y reconstruyendo contenedores...${NC}"

# Primero verificamos si existe el directorio y lo clonamos si no
ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "powershell -Command \"
if (-not (Test-Path 'D:\\Projectos\\prosolutions_inventario_web\\.git')) {
    Write-Host '>>> Clonando repositorio por primera vez...'
    if (-not (Test-Path 'D:\\Projectos')) {
        New-Item -ItemType Directory -Force -Path 'D:\\Projectos'
    }
    Set-Location 'D:\\Projectos'
    git clone https://github.com/GalindoAsc/prosolutions_inventario_web.git
    Write-Host '>>> Repositorio clonado exitosamente'
} else {
    Write-Host '>>> Repositorio ya existe'
}
\""

# Ahora actualizamos y desplegamos
ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "powershell -Command \"
Set-Location 'D:\\Projectos\\prosolutions_inventario_web'

Write-Host '>>> Actualizando desde GitHub...'
git fetch --all
git reset --hard origin/main
git clean -fd

Write-Host '>>> Verificando archivo .env...'
if (-not (Test-Path '.env')) {
    Write-Host 'ADVERTENCIA: No existe .env, creando plantilla...'
    \\\$envContent = @'
DATABASE_URL=postgresql://prosolutions:prosolutions123@db:5432/prosolutions_inventario?schema=public
NEXTAUTH_SECRET=super-secret-key-change-in-production
NEXTAUTH_URL=https://prosolutions.ascnex.com
'@
    \\\$envContent | Out-File -FilePath '.env' -Encoding UTF8
    Write-Host 'Archivo .env creado - RECUERDA CONFIGURAR LAS CREDENCIALES'
}

Write-Host '>>> Reconstruyendo contenedores Docker...'
docker compose down 2>$null
docker compose up -d --build

Write-Host '>>> Esperando a que la app inicie...'
Start-Sleep -Seconds 15

Write-Host '>>> Ejecutando migraciones de base de datos...'
docker compose exec -T app npx prisma db push 2>$null

Write-Host '>>> Verificando estado...'
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
\""

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}>>> ¡Despliegue en N5 Pro completado!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Acceso:${NC}"
echo "  - Web: https://prosolutions.ascnex.com"
echo ""
