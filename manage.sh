#!/usr/bin/env bash
# =============================================================================
# Armbian Site Manager
# Management script for the Armbian website Docker Compose stack.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[info]${RESET}  $*"; }
success() { echo -e "${GREEN}[ok]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET}  $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; }
die()     { error "$*"; exit 1; }

# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------
banner() {
  echo -e "${BOLD}${CYAN}"
  echo "  ╔═══════════════════════════════════╗"
  echo "  ║      Armbian Site Manager         ║"
  echo "  ╚═══════════════════════════════════╝"
  echo -e "${RESET}"
}

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------
check_deps() {
  command -v docker >/dev/null 2>&1 || die "Docker is not installed or not in PATH."
  docker compose version >/dev/null 2>&1 || die "'docker compose' (v2) is not available."
}

# ---------------------------------------------------------------------------
# Project root — always run compose from here regardless of cwd
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE="docker compose"
BACKUPS_DIR="$SCRIPT_DIR/backups"
CACHE_DIR="$SCRIPT_DIR/cache"

# Named Docker volumes for each workspace node_modules. Using named volumes
# (not host bind mounts) avoids leaving empty placeholder directories in the
# project root — Docker would otherwise create them whenever we mount a path
# nested inside a bind-mounted source tree.
NM_VOLUMES=(
  "armbian_nm_root:/app/node_modules"
  "armbian_nm_api:/app/apps/api/node_modules"
  "armbian_nm_www:/app/apps/www/node_modules"
  "armbian_nm_schemas:/app/packages/schemas/node_modules"
  "armbian_nm_config:/app/packages/config/node_modules"
  "armbian_nm_api_client:/app/packages/api-client/node_modules"
  "armbian_nm_theme:/app/packages/theme/node_modules"
)

# Prepare the host-side pnpm store (visible under ./cache/) before any
# docker run. Named volumes above are created lazily by Docker.
_ensure_cache_dirs() {
  mkdir -p "$CACHE_DIR/pnpm-store"
}

# Emit the `-v` flags for the pnpm store bind mount + every named node_modules
# volume. Use with: docker run $(_cache_mounts) ...
_cache_mounts() {
  printf -- '-v %s:/app/.pnpm-store ' "$CACHE_DIR/pnpm-store"
  local entry
  for entry in "${NM_VOLUMES[@]}"; do
    printf -- '-v %s ' "$entry"
  done
}

# Docker creates empty placeholder directories in the project root whenever
# we nest a mount inside a bind-mounted source tree. Real dep content lives
# in the named volumes, so these placeholders are always 0 bytes and safe to
# remove after the container exits.
_cleanup_mount_placeholders() {
  local paths=(
    "$SCRIPT_DIR/.pnpm-store"
    "$SCRIPT_DIR/node_modules"
    "$SCRIPT_DIR/apps/api/node_modules"
    "$SCRIPT_DIR/apps/www/node_modules"
    "$SCRIPT_DIR/packages/schemas/node_modules"
    "$SCRIPT_DIR/packages/config/node_modules"
    "$SCRIPT_DIR/packages/api-client/node_modules"
    "$SCRIPT_DIR/packages/theme/node_modules"
  )
  local p
  for p in "${paths[@]}"; do
    # rmdir only removes empty dirs — guards against wiping real content.
    [[ -d "$p" ]] && rmdir "$p" 2>/dev/null || true
  done
}

# ---------------------------------------------------------------------------
# cmd: up
# ---------------------------------------------------------------------------
cmd_up() {
  cmd_env_check
  info "Building and starting all services..."
  $COMPOSE up -d --build
  info "Waiting for health checks..."
  _wait_healthy 120
  cmd_status
}

# ---------------------------------------------------------------------------
# cmd: deploy — pull pre-built images from GHCR and restart
# ---------------------------------------------------------------------------
cmd_deploy() {
  cmd_env_check
  if command -v git >/dev/null 2>&1 && [[ -d "$SCRIPT_DIR/.git" ]]; then
    info "Pulling latest changes from repository..."
    git -C "$SCRIPT_DIR" fetch --all --tags --force --quiet
    # Only pull if on a branch (skip on detached HEAD from tag checkout).
    if git -C "$SCRIPT_DIR" symbolic-ref HEAD >/dev/null 2>&1; then
      git -C "$SCRIPT_DIR" pull --ff-only --quiet
    fi
  fi
  info "Pulling latest images from registry..."
  $COMPOSE pull api www
  info "Restarting services..."
  $COMPOSE up -d
  info "Waiting for health checks..."
  _wait_healthy 120
  info "Removing unused Docker images..."
  docker image prune -af --filter "until=168h" 2>/dev/null || true
  cmd_status
}

# ---------------------------------------------------------------------------
# cmd: down
# ---------------------------------------------------------------------------
cmd_down() {
  info "Stopping all services..."
  $COMPOSE down
  success "All services stopped."
}

# ---------------------------------------------------------------------------
# cmd: reset
# ---------------------------------------------------------------------------
cmd_reset() {
  warn "This will stop all services AND wipe all volumes (database + cache)."
  _confirm "Are you sure? [y/N] " || { info "Aborted."; exit 0; }
  info "Tearing down with volumes..."
  $COMPOSE down -v
  info "Rebuilding from scratch..."
  cmd_env_check
  $COMPOSE up -d --build
  info "Waiting for health checks..."
  _wait_healthy 180
  cmd_status
}

# ---------------------------------------------------------------------------
# cmd: rebuild [service]
# ---------------------------------------------------------------------------
cmd_rebuild() {
  local service="${1:-}"
  if [[ -n "$service" ]]; then
    _validate_service "$service"
    info "Rebuilding service: ${BOLD}$service${RESET}..."
    $COMPOSE build "$service"
    $COMPOSE up -d "$service"
    success "Service '$service' rebuilt and restarted."
  else
    info "Rebuilding all services..."
    $COMPOSE build
    $COMPOSE up -d
    success "All services rebuilt and restarted."
  fi
}

# ---------------------------------------------------------------------------
# cmd: logs [service]
# ---------------------------------------------------------------------------
cmd_logs() {
  local service="${1:-}"
  if [[ -n "$service" ]]; then
    _validate_service "$service"
    info "Following logs for: ${BOLD}$service${RESET}  (Ctrl+C to stop)"
    $COMPOSE logs -f "$service"
  else
    info "Following logs for all services  (Ctrl+C to stop)"
    $COMPOSE logs -f
  fi
}

# ---------------------------------------------------------------------------
# cmd: status
# ---------------------------------------------------------------------------
cmd_status() {
  echo ""
  echo -e "${BOLD}Container status:${RESET}"
  $COMPOSE ps
  echo ""

  echo -e "${BOLD}Health checks:${RESET}"
  local all_healthy=true

  for svc in api postgres www caddy; do
    local cid
    cid=$($COMPOSE ps -q "$svc" 2>/dev/null || true)
    if [[ -z "$cid" ]]; then
      echo -e "  ${RED}$svc${RESET}: not running"
      all_healthy=false
      continue
    fi
    local state
    state=$(docker inspect --format='{{.State.Health.Status}}' "$cid" 2>/dev/null || echo "no healthcheck")
    case "$state" in
      healthy)   echo -e "  ${GREEN}$svc${RESET}: healthy" ;;
      starting)  echo -e "  ${YELLOW}$svc${RESET}: starting..." ;;
      unhealthy) echo -e "  ${RED}$svc${RESET}: unhealthy"; all_healthy=false ;;
      *)         echo -e "  ${CYAN}$svc${RESET}: $state" ;;
    esac
  done

  echo ""
  echo -e "${BOLD}Endpoint checks:${RESET}"
  # API port is not exposed to host — check via docker exec
  local api_cid
  api_cid=$($COMPOSE ps -q api 2>/dev/null || true)
  if [[ -n "$api_cid" ]]; then
    local api_code
    api_code=$(docker exec "$api_cid" node -e "fetch('http://localhost:3001/api/v1/health').then(r=>process.stdout.write(String(r.status))).catch(()=>process.stdout.write('000'))" 2>/dev/null || echo "000")
    if [[ "$api_code" =~ ^[23] ]]; then
      echo -e "  ${GREEN}API (internal)${RESET}: HTTP $api_code"
    else
      echo -e "  ${RED}API (internal)${RESET}: HTTP $api_code (unreachable or error)"
    fi
  else
    echo -e "  ${RED}API (internal)${RESET}: container not running"
  fi
  _http_check "http://localhost/" "WWW (Caddy)"
  _load_env_vars
  local api_host="${API_HOSTNAME:-:8080}"
  if [[ "$api_host" == :* ]]; then
    _http_check "http://localhost${api_host}/api/v1/health" "API (Caddy ${api_host})"
  else
    _http_check "https://${api_host}/api/v1/health" "API (${api_host})"
  fi
  # Imager hostname only exposed in production. In dev the imager is
  # reachable at http://localhost/imager (covered by the WWW check above).
  local imager_host="${IMAGER_HOSTNAME:-}"
  if [[ -n "$imager_host" && "$imager_host" != :* ]]; then
    _http_check "https://${imager_host}/" "Imager (${imager_host})"
  fi
  echo ""

  $all_healthy && success "Stack is healthy." || warn "Some services need attention."
}

# ---------------------------------------------------------------------------
# cmd: sync — force an immediate upstream data sync
# ---------------------------------------------------------------------------
cmd_sync() {
  local api_cid
  api_cid=$($COMPOSE ps -q api 2>/dev/null || true)
  [[ -n "$api_cid" ]] || die "API container is not running."

  info "Triggering upstream sync and Caddy redirect reload..."
  local response
  response=$(docker exec "$api_cid" node -e "
    fetch('http://localhost:3001/api/v1/sync', {
      method: 'POST',
      headers: { 'X-Armbian-Client': 'manage.sh' },
    })
      .then(r => r.text().then(body => ({ status: r.status, body })))
      .then(({ status, body }) => {
        process.stdout.write(status + ' ' + body);
        process.exit(status >= 200 && status < 300 ? 0 : 1);
      })
      .catch(err => {
        process.stdout.write('error ' + err.message);
        process.exit(1);
      });
  " 2>&1) || { error "$response"; die "Sync trigger failed."; }

  success "Sync started. Watch progress with: ./manage.sh logs api"
  info "The Caddy redirect map will update automatically when sync completes (~2s)."
}

# ---------------------------------------------------------------------------
# cmd: shell [service]
# ---------------------------------------------------------------------------
cmd_shell() {
  local service="${1:-www}"
  _validate_service "$service"
  local cid
  cid=$($COMPOSE ps -q "$service" 2>/dev/null || true)
  [[ -n "$cid" ]] || die "Service '$service' is not running."
  info "Opening shell in '$service'..."
  $COMPOSE exec "$service" sh
}

# ---------------------------------------------------------------------------
# cmd: db
# ---------------------------------------------------------------------------
cmd_db() {
  local db_name="${POSTGRES_DB:-payload}"
  local db_user="${POSTGRES_USER:-payload}"
  _load_env_vars
  db_name="${POSTGRES_DB:-payload}"
  db_user="${POSTGRES_USER:-payload}"
  info "Connecting to PostgreSQL as '${db_user}' on database '${db_name}'..."
  $COMPOSE exec postgres psql -U "$db_user" -d "$db_name"
}

# ---------------------------------------------------------------------------
# cmd: db:backup
# ---------------------------------------------------------------------------
cmd_db_backup() {
  _load_env_vars
  local db_name="${POSTGRES_DB:-payload}"
  local db_user="${POSTGRES_USER:-payload}"
  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local filename="${BACKUPS_DIR}/${db_name}_${timestamp}.sql.gz"

  mkdir -p "$BACKUPS_DIR"
  info "Dumping database '${db_name}' to:"
  info "  $filename"

  $COMPOSE exec -T postgres pg_dump -U "$db_user" -d "$db_name" | gzip > "$filename"
  success "Backup complete: $filename"
  ls -lh "$filename"
}

# ---------------------------------------------------------------------------
# cmd: db:restore [file]
# ---------------------------------------------------------------------------
cmd_db_restore() {
  local file="${1:-}"
  [[ -n "$file" ]] || die "Usage: $0 db:restore <backup-file>"
  [[ -f "$file" ]] || die "File not found: $file"

  _load_env_vars
  local db_name="${POSTGRES_DB:-payload}"
  local db_user="${POSTGRES_USER:-payload}"

  warn "This will restore '$file' into database '${db_name}'."
  warn "Existing data in that database will be dropped and recreated."
  _confirm "Continue? [y/N] " || { info "Aborted."; exit 0; }

  info "Restoring from: $file"

  # Drop and recreate database
  $COMPOSE exec -T postgres psql -U "$db_user" -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db_name}';" \
    -c "DROP DATABASE IF EXISTS \"${db_name}\";" \
    -c "CREATE DATABASE \"${db_name}\" OWNER \"${db_user}\";"

  # Restore dump (handles both gzipped and plain SQL)
  if [[ "$file" == *.gz ]]; then
    gunzip -c "$file" | $COMPOSE exec -T postgres psql -U "$db_user" -d "$db_name"
  else
    $COMPOSE exec -T postgres psql -U "$db_user" -d "$db_name" < "$file"
  fi

  success "Restore complete."
}

# ---------------------------------------------------------------------------
# cmd: cache:clean — wipe the host-side dependency cache
# ---------------------------------------------------------------------------
cmd_cache_clean() {
  local has_dir=false
  local has_vols=false
  [[ -d "$CACHE_DIR" ]] && has_dir=true
  docker volume ls -q --filter name=armbian_nm_ 2>/dev/null | grep -q . && has_vols=true

  if ! $has_dir && ! $has_vols; then
    info "No cache to clean (./cache missing and no armbian_nm_* volumes)."
    return 0
  fi

  warn "This will remove:"
  $has_dir  && echo "  - ./cache (pnpm store)"
  $has_vols && echo "  - Docker named volumes: $(docker volume ls -q --filter name=armbian_nm_ | tr '\n' ' ')"
  _confirm "Continue? [y/N] " || { info "Aborted."; exit 0; }

  $has_dir && rm -rf "$CACHE_DIR"
  if $has_vols; then
    # shellcheck disable=SC2046
    docker volume rm $(docker volume ls -q --filter name=armbian_nm_) >/dev/null 2>&1 || true
  fi
  _cleanup_mount_placeholders
  success "Cache cleared."
}

# ---------------------------------------------------------------------------
# cmd: clean
# ---------------------------------------------------------------------------
cmd_clean() {
  warn "This will remove all Docker images, volumes, and build cache for this project."
  _confirm "Are you absolutely sure? [y/N] " || { info "Aborted."; exit 0; }

  info "Stopping services..."
  $COMPOSE down -v --remove-orphans || true

  info "Removing built images..."
  # Remove images built by this compose project
  local project_name
  project_name=$(basename "$SCRIPT_DIR" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
  docker images --filter "label=com.docker.compose.project=${project_name}" -q | xargs -r docker rmi -f || true

  info "Pruning dangling images and build cache..."
  docker image prune -f
  docker builder prune -f

  success "Clean complete."
}

# ---------------------------------------------------------------------------
# cmd: env
# ---------------------------------------------------------------------------
cmd_env_check() {
  echo ""
  echo -e "${BOLD}Environment check:${RESET}"

  if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
    error ".env file not found."
    info  "Run: cp .env.example .env  — then fill in the required values."
    exit 1
  fi
  success ".env file present."

  _load_env_vars

  local required_vars=("POSTGRES_PASSWORD" "PAYLOAD_SECRET")
  local optional_vars=("OIDC_CLIENT_ID" "OIDC_CLIENT_SECRET" "OIDC_ISSUER_URL" "OIDC_ALLOWED_DOMAINS")
  local all_ok=true

  for var in "${required_vars[@]}"; do
    local val="${!var:-}"
    if [[ -z "$val" ]]; then
      error "Required variable not set: $var"
      all_ok=false
    elif [[ "$val" == "replace-with-"* ]]; then
      warn "Variable still has placeholder value: $var"
      all_ok=false
    else
      success "$var is set."
    fi
  done

  for var in "${optional_vars[@]}"; do
    local val="${!var:-}"
    if [[ -z "$val" ]]; then
      warn "Optional variable is empty (OIDC disabled): $var"
    else
      success "$var is set."
    fi
  done

  echo ""
  $all_ok && success "Environment looks good." || { error "Fix the issues above before starting the stack."; exit 1; }
}

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_load_env_vars() {
  if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
    return
  fi
  # Parse KEY=VALUE lines directly instead of sourcing via bash. This is
  # resilient to values that contain spaces or commas (WWW_HOSTNAME,
  # CORS_ORIGINS), which bash would otherwise split into separate commands
  # when the value is not quoted. Also tolerates CRLF line endings and a
  # UTF-8 BOM on the first line (common when .env is scp'd from Windows).
  local line key value first=1
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Strip trailing CR from CRLF-terminated files.
    line="${line%$'\r'}"
    # Strip UTF-8 BOM on the first line only.
    if (( first )); then
      line="${line#$'\xef\xbb\xbf'}"
      first=0
    fi
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$line" ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      # Strip matching surrounding single or double quotes.
      if [[ "$value" =~ ^\"(.*)\"$ ]] || [[ "$value" =~ ^\'(.*)\'$ ]]; then
        value="${BASH_REMATCH[1]}"
      fi
      export "$key=$value"
    fi
  done < "$SCRIPT_DIR/.env"
}

_validate_service() {
  local service="$1"
  case "$service" in
    api|postgres|www|caddy) ;;
    *) die "Unknown service: '$service'. Valid services: api, postgres, www, caddy" ;;
  esac
}

_confirm() {
  local prompt="$1"
  local reply
  printf "${YELLOW}%s${RESET}" "$prompt"
  read -r reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

_http_check() {
  local url="$1"
  local label="$2"
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null || echo "000")
  if [[ "$http_code" =~ ^[23] ]]; then
    echo -e "  ${GREEN}$label${RESET}: HTTP $http_code"
  else
    echo -e "  ${RED}$label${RESET}: HTTP $http_code (unreachable or error)"
  fi
}

_wait_healthy() {
  local timeout="${1:-120}"
  local elapsed=0
  local interval=5
  local services=("api" "postgres" "www" "caddy")

  while (( elapsed < timeout )); do
    local all_healthy=true
    for svc in "${services[@]}"; do
      local cid
      cid=$($COMPOSE ps -q "$svc" 2>/dev/null || true)
      [[ -n "$cid" ]] || { all_healthy=false; break; }
      local state
      state=$(docker inspect --format='{{.State.Health.Status}}' "$cid" 2>/dev/null || echo "unknown")
      [[ "$state" == "healthy" ]] || { all_healthy=false; break; }
    done

    if $all_healthy; then
      success "All services are healthy."
      return 0
    fi

    printf "${CYAN}[info]${RESET}  Waiting for services... (%ds elapsed)\r" "$elapsed"
    sleep "$interval"
    (( elapsed += interval ))
  done

  echo ""
  warn "Timed out waiting for health checks after ${timeout}s."
  warn "Services may still be starting — run './manage.sh status' to check."
}

# ---------------------------------------------------------------------------
# cmd: quality — run lint / typecheck / test inside Docker
#
# Uses a one-shot Node container so no local node_modules are required.
# Works on the project checkout mounted at /app.
# ---------------------------------------------------------------------------
cmd_quality() {
  local check="${1:-all}"
  local run_lint=false
  local run_typecheck=false
  local run_test=false
  local run_format=false

  case "$check" in
    all)        run_typecheck=true; run_test=true ;;
    lint)       run_lint=true ;;
    typecheck)  run_typecheck=true ;;
    test)       run_test=true ;;
    format)     run_format=true ;;
    *)
      error "Unknown quality check: '$check'"
      info  "Valid checks: all, lint, typecheck, test, format"
      exit 1
      ;;
  esac

  info "Running quality checks: ${BOLD}$check${RESET} (inside Docker)"

  local cmds=()
  $run_lint      && cmds+=("pnpm lint")
  $run_typecheck && cmds+=("pnpm typecheck")
  $run_test      && cmds+=("pnpm test")
  $run_format    && cmds+=("pnpm format:check")

  if (( ${#cmds[@]} == 0 )); then
    warn "No checks selected."
    return 0
  fi

  # Chain with && so the first failure stops the run and returns non-zero.
  local joined="${cmds[0]}"
  local i
  for (( i=1; i<${#cmds[@]}; i++ )); do
    joined+=" && ${cmds[$i]}"
  done

  _ensure_cache_dirs

  local failed=false
  # shellcheck disable=SC2046
  docker run --rm \
    -e NPM_CONFIG_STORE_DIR=/app/.pnpm-store \
    -v "$SCRIPT_DIR":/app \
    $(_cache_mounts) \
    -w /app \
    node:22-alpine \
    sh -c "corepack enable && corepack prepare pnpm@10 --activate && pnpm install --frozen-lockfile --prefer-offline && $joined" \
    || failed=true

  _cleanup_mount_placeholders

  if $failed; then
    error "Quality checks failed."
    exit 1
  fi
  success "All quality checks passed."
}

# ---------------------------------------------------------------------------
# cmd: pnpm — run pnpm commands inside Docker (no local node_modules)
# ---------------------------------------------------------------------------
cmd_pnpm() {
  if [[ $# -eq 0 ]]; then
    error "Usage: ./manage.sh pnpm <args...>"
    echo "  Examples:"
    echo "    ./manage.sh pnpm add -F @armbian/api @fastify/under-pressure"
    echo "    ./manage.sh pnpm add -F @armbian/www some-package"
    echo "    ./manage.sh pnpm remove -F @armbian/api some-package"
    echo "    ./manage.sh pnpm install"
    echo "    ./manage.sh pnpm update"
    exit 1
  fi

  _ensure_cache_dirs

  info "Running: pnpm $* (inside Docker)"
  # shellcheck disable=SC2046
  docker run --rm \
    -e NPM_CONFIG_STORE_DIR=/app/.pnpm-store \
    -v "$SCRIPT_DIR":/app \
    $(_cache_mounts) \
    -w /app \
    node:22-alpine \
    sh -c "corepack enable && corepack prepare pnpm@10 --activate && pnpm $*"

  _cleanup_mount_placeholders

  success "Done. Lockfile updated. Run './manage.sh rebuild' to apply."
}

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
cmd_help() {
  banner
  echo -e "${BOLD}Usage:${RESET}  ./manage.sh <command> [args]"
  echo ""
  echo -e "${BOLD}Commands:${RESET}"
  echo -e "  ${CYAN}up${RESET}                   Build and start all services, wait for health checks"
  echo -e "  ${CYAN}deploy${RESET}               Pull pre-built images from GHCR and restart"
  echo -e "  ${CYAN}down${RESET}                 Stop all services"
  echo -e "  ${CYAN}reset${RESET}                Stop all, wipe volumes (DB + cache), rebuild from scratch"
  echo -e "  ${CYAN}rebuild [service]${RESET}    Rebuild a specific service (www, api) or all if unspecified"
  echo -e "  ${CYAN}logs [service]${RESET}       Follow logs — defaults to all services"
  echo -e "  ${CYAN}status${RESET}               Show container status, health, and endpoint checks"
  echo -e "  ${CYAN}sync${RESET}                 Force an immediate upstream sync and Caddy redirect reload"
  echo -e "  ${CYAN}shell [service]${RESET}      Open a shell inside a container — defaults to www"
  echo -e "  ${CYAN}db${RESET}                   Connect to PostgreSQL via psql"
  echo -e "  ${CYAN}db:backup${RESET}            Dump the database to backups/ with a timestamp"
  echo -e "  ${CYAN}db:restore <file>${RESET}    Restore a database backup file (.sql or .sql.gz)"
  echo -e "  ${CYAN}pnpm <args...>${RESET}       Run pnpm commands inside Docker (add/remove/update packages)"
  echo -e "  ${CYAN}quality [check]${RESET}      Run typecheck + test (check: all|lint|typecheck|test|format)"
  echo -e "  ${CYAN}cache:clean${RESET}          Wipe ./cache (pnpm store + workspace node_modules)"
  echo -e "  ${CYAN}clean${RESET}                Remove Docker images, volumes, and build cache (with confirmation)"
  echo -e "  ${CYAN}env${RESET}                  Validate .env file and required variables"
  echo -e "  ${CYAN}help${RESET}                 Show this help message"
  echo ""
  echo -e "${BOLD}Examples:${RESET}"
  echo "  ./manage.sh up"
  echo "  ./manage.sh deploy              # pull pre-built images + restart"
  echo "  ./manage.sh rebuild www"
  echo "  ./manage.sh logs api"
  echo "  ./manage.sh db:backup"
  echo "  ./manage.sh db:restore backups/payload_20260101_120000.sql.gz"
  echo "  ./manage.sh shell api"
  echo "  ./manage.sh quality             # run typecheck + test"
  echo "  ./manage.sh quality typecheck   # run only typecheck"
  echo ""
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
check_deps

COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
  up)          banner; cmd_up ;;
  deploy)      banner; cmd_deploy ;;
  down)        banner; cmd_down ;;
  reset)       banner; cmd_reset ;;
  rebuild)     banner; cmd_rebuild "$@" ;;
  logs)        cmd_logs "$@" ;;
  status)      banner; cmd_status ;;
  sync)        banner; cmd_sync ;;
  shell)       cmd_shell "$@" ;;
  db)          cmd_db ;;
  db:backup)   banner; cmd_db_backup ;;
  db:restore)  banner; cmd_db_restore "$@" ;;
  pnpm)        banner; cmd_pnpm "$@" ;;
  quality)     banner; cmd_quality "$@" ;;
  cache:clean) banner; cmd_cache_clean ;;
  clean)       banner; cmd_clean ;;
  env)         banner; cmd_env_check ;;
  help|--help|-h) cmd_help ;;
  *)
    error "Unknown command: '$COMMAND'"
    echo ""
    cmd_help
    exit 1
    ;;
esac
