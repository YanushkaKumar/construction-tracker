#!/usr/bin/env bash
#
# Nightly logical backup of the production database.
#
# The database lives on Supabase's free tier, which does not include automated
# backups — so without this there is no copy of the company's financial records
# anywhere. Runs from cron on the EC2 host; see the install note at the bottom.
#
# pg_dump must be at least the server's major version (currently PostgreSQL 17),
# otherwise it refuses to run against it, so the image tag is pinned to match.
set -euo pipefail

BUILDTRACK_DIR="${BUILDTRACK_DIR:-/home/ubuntu/buildtrack}"
BACKUP_DIR="${BACKUP_DIR:-$BUILDTRACK_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
PG_IMAGE="${PG_IMAGE:-postgres:17-alpine}"

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }

# DATABASE_URL is only in the deployment .env, which is not world-readable.
if [ ! -r "$BUILDTRACK_DIR/.env" ]; then
  log "ERROR: cannot read $BUILDTRACK_DIR/.env"
  exit 1
fi
DATABASE_URL="$(grep -E '^DATABASE_URL=' "$BUILDTRACK_DIR/.env" | head -1 | cut -d= -f2-)"
if [ -z "${DATABASE_URL:-}" ]; then
  log "ERROR: DATABASE_URL not set in $BUILDTRACK_DIR/.env"
  exit 1
fi

# DATABASE_URL carries Prisma-only query parameters (connection_limit,
# pool_timeout, pgbouncer, schema). libpq rejects those outright, so strip
# them and keep the rest of the URI (notably sslmode) intact.
DUMP_URL="$(printf '%s' "$DATABASE_URL" | sed -E \
  -e 's/(connection_limit|pool_timeout|pgbouncer|schema)=[^&]*//g' \
  -e 's/&+/\&/g' -e 's/\?&/?/' -e 's/[?&]+$//')"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date -u '+%Y%m%d-%H%M%S')"
TARGET="$BACKUP_DIR/buildtrack-$STAMP.sql.gz"
TMP="$TARGET.partial"

log "starting backup -> $(basename "$TARGET")"

# Write to a .partial file first and only rename on success, so an interrupted
# run can never leave behind a truncated file that looks like a good backup.
if docker run --rm -e PGCONNECT_TIMEOUT=30 "$PG_IMAGE" \
      pg_dump "$DUMP_URL" --no-owner --no-privileges --schema=public \
    | gzip -9 > "$TMP"; then
  :
else
  log "ERROR: pg_dump failed"
  rm -f "$TMP"
  exit 1
fi

# A dump of an empty/failed connection still produces a small header-only file.
# Require the real table data to be present before accepting it.
#
# Counted rather than `grep -q`: -q exits on the first match, which SIGPIPEs
# gzip upstream, and under `set -o pipefail` that makes the whole check look
# like a failure — discarding a perfectly good backup, intermittently,
# depending on where in the stream the match lands.
set +o pipefail
FOUND="$(gzip -cd "$TMP" | grep -c 'CREATE TABLE public\.companies')"
set -o pipefail
if [ "${FOUND:-0}" -eq 0 ]; then
  log "ERROR: dump looks incomplete (no companies table) — discarding"
  rm -f "$TMP"
  exit 1
fi

mv "$TMP" "$TARGET"
chmod 600 "$TARGET"
log "backup complete: $(du -h "$TARGET" | cut -f1)"

DELETED="$(find "$BACKUP_DIR" -name 'buildtrack-*.sql.gz' -mtime "+$RETENTION_DAYS" -print -delete | wc -l)"
log "pruned $DELETED backup(s) older than $RETENTION_DAYS days"
log "on disk: $(find "$BACKUP_DIR" -name 'buildtrack-*.sql.gz' | wc -l) backup(s), $(du -sh "$BACKUP_DIR" | cut -f1)"

# Install (run once on the host):
#   chmod +x ~/buildtrack/infra/scripts/backup-db.sh
#   (crontab -l 2>/dev/null; echo "15 2 * * * /home/ubuntu/buildtrack/infra/scripts/backup-db.sh >> /home/ubuntu/buildtrack/backups/backup.log 2>&1") | crontab -
#
# Restore:
#   gzip -cd backups/buildtrack-<stamp>.sql.gz | docker run --rm -i postgres:17-alpine psql "$DATABASE_URL"
