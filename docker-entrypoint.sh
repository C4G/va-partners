#!/bin/sh
# Dump the database when migrations are pending, apply them, then start the server.
set -e

SCHEMA=./prisma/schema.prisma
ATTEMPTS=30
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_KEEP="${BACKUP_KEEP:-10}"
# off = never dump (test), best-effort = dump but migrate anyway on failure, required = no dump, no migration.
BACKUP_MODE="${BACKUP_MODE:-best-effort}"

log() { echo "[entrypoint] $*"; }

# Reject typos loudly: a misspelt "required" must not silently downgrade to best-effort.
case "$BACKUP_MODE" in
  off|best-effort|required) ;;
  *) log "ERROR: BACKUP_MODE must be off, best-effort or required (got '$BACKUP_MODE')."; exit 1 ;;
esac

backup_unavailable() {
  if [ "$BACKUP_MODE" = "required" ]; then
    log "ERROR: $1; BACKUP_MODE=required, refusing to migrate."
    exit 1
  fi
  log "WARNING: $1; continuing because BACKUP_MODE is '$BACKUP_MODE'."
}

# Emit shell-quoted DB_* assignments; node parses percent-encoding that sed would mangle.
parse_database_url() {
  node -e '
    const SQ = String.fromCharCode(39);
    const q = (s) => SQ + String(s == null ? "" : s).split(SQ).join(SQ + "\\" + SQ + SQ) + SQ;
    const dec = (s) => { try { return decodeURIComponent(s); } catch (e) { return s; } };
    let u;
    try { u = new URL(process.env.DATABASE_URL); } catch (e) { console.error("not a valid URL"); process.exit(1); }
    const out = {
      DB_HOST: u.hostname,
      DB_PORT: u.port || "3306",
      DB_USER: dec(u.username),
      DB_PASS: dec(u.password),
      DB_NAME: dec(u.pathname).replace(/^\//, ""),
    };
    for (const k of Object.keys(out)) console.log(k + "=" + q(out[k]));
  '
}

prune_backups() {
  # shellcheck disable=SC2012 # filenames are generated timestamps, never exotic
  ls -1t "$BACKUP_DIR"/pre-migrate-*.sql.gz 2>/dev/null \
    | tail -n "+$((BACKUP_KEEP + 1))" \
    | while read -r old; do
        log "Pruning old backup $(basename "$old")"
        rm -f "$old"
      done
}

take_backup() {
  if [ "$BACKUP_MODE" = "off" ]; then
    log "BACKUP_MODE=off; skipping the pre-migration backup."
    return 0
  fi
  if ! command -v mysqldump >/dev/null 2>&1; then
    backup_unavailable "mysqldump is not installed in this image"
    return 0
  fi
  if [ -z "$DATABASE_URL" ]; then
    backup_unavailable "DATABASE_URL is unset"
    return 0
  fi
  if ! mkdir -p "$BACKUP_DIR" 2>/dev/null || [ ! -w "$BACKUP_DIR" ]; then
    backup_unavailable "backup directory $BACKUP_DIR is missing or not writable by uid $(id -u)"
    return 0
  fi
  if ! assignments=$(parse_database_url 2>&1); then
    backup_unavailable "could not parse DATABASE_URL ($assignments)"
    return 0
  fi
  eval "$assignments"

  # Probe --help so an option the installed client lacks cannot abort the dump.
  opts="--single-transaction --quick --routines --triggers --default-character-set=utf8mb4"
  if mysqldump --help 2>/dev/null | grep -q -- "--no-tablespaces"; then
    opts="$opts --no-tablespaces"
  fi

  # A crash-looping container re-runs this with identical pending state; reuse that dump
  # rather than churning out copies until pruning drops the one taken before the failure.
  fingerprint=$(printf '%s' "$1" | md5sum | cut -d' ' -f1)
  fp_file="$BACKUP_DIR/.last-fingerprint"
  if [ -f "$fp_file" ] && [ "$(cat "$fp_file")" = "$fingerprint" ] \
     && [ -n "$(find "$BACKUP_DIR" -name 'pre-migrate-*.sql.gz' -print -quit 2>/dev/null)" ]; then
    log "Database is unchanged since the last backup; reusing it."
    return 0
  fi

  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  final="$BACKUP_DIR/pre-migrate-$stamp.sql.gz"
  tmp="$BACKUP_DIR/.pre-migrate-$stamp.sql"

  log "Backing up $DB_NAME from $DB_HOST:$DB_PORT to $final ..."
  # shellcheck disable=SC2086
  if ! MYSQL_PWD="$DB_PASS" mysqldump \
        --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" \
        $opts $BACKUP_MYSQLDUMP_OPTS "$DB_NAME" > "$tmp" 2>"$tmp.err"; then
    log "$(cat "$tmp.err" 2>/dev/null)"
    rm -f "$tmp" "$tmp.err"
    backup_unavailable "mysqldump failed"
    return 0
  fi

  # mysqldump writes this marker last, so its absence means a truncated dump.
  if ! tail -c 512 "$tmp" | grep -q "Dump completed"; then
    rm -f "$tmp" "$tmp.err"
    backup_unavailable "dump is incomplete (no completion marker)"
    return 0
  fi

  rm -f "$tmp.err"
  if ! gzip "$tmp" || ! mv "$tmp.gz" "$final"; then
    rm -f "$tmp" "$tmp.gz"
    backup_unavailable "could not compress the dump"
    return 0
  fi

  printf '%s' "$fingerprint" > "$fp_file"
  log "Backup complete: $final ($(du -h "$final" | cut -f1))"
  prune_backups
}

# Wait for the database and find out whether anything is pending.
pending=unknown
i=1
while [ "$i" -le "$ATTEMPTS" ]; do
  if status=$(prisma migrate status --schema "$SCHEMA" 2>&1); then
    pending=no
    break
  fi
  case "$status" in
    *P1001*)
      # Print the error once so the log names the host it cannot reach.
      [ "$i" = 1 ] && echo "$status"
      log "Database not reachable yet (attempt $i/$ATTEMPTS); retrying in 2s..."
      i=$((i + 1))
      sleep 2
      ;;
    *)
      pending=yes
      break
      ;;
  esac
done

if [ "$pending" = "unknown" ]; then
  log "Database never became reachable after $ATTEMPTS attempts; aborting."
  exit 1
fi

if [ "$pending" = "no" ]; then
  log "Schema is already up to date; skipping backup."
else
  log "Migrations are pending:"
  echo "$status"
  take_backup "$status"
fi

i=1
while [ "$i" -le "$ATTEMPTS" ]; do
  log "Applying Prisma migrations (attempt $i/$ATTEMPTS)..."
  if out=$(prisma migrate deploy --schema "$SCHEMA" 2>&1); then
    echo "$out"
    log "Migrations applied. Starting server..."
    exec "$@"
  fi
  echo "$out"
  if echo "$out" | grep -q "P1001"; then
    log "Database not reachable yet; retrying in 2s..."
    i=$((i + 1))
    sleep 2
    continue
  fi
  log "Migration failed with a non-connection error; aborting."
  exit 1
done

log "Database never became reachable after $ATTEMPTS attempts; aborting."
exit 1
