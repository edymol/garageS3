#!/bin/sh
# One-time cluster setup for the demo: apply a layout, import a fixed demo S3
# key, and create a bucket. Idempotent — safe to re-run on `docker compose up`.
set -e

CONF=/etc/garage.toml
G="garage -c $CONF"

echo "[init] waiting for Garage RPC..."
until $G status >/dev/null 2>&1; do sleep 1; done

NODE=$($G status | grep -oE '^[0-9a-f]{16}' | head -1)
echo "[init] node id: $NODE"

# 1) Apply a cluster layout (a fresh node has NO ROLE ASSIGNED; without this,
#    ListBuckets/ListKeys return 500 "Layout not ready").
if $G status | grep -q "NO ROLE ASSIGNED"; then
  echo "[init] assigning + applying cluster layout..."
  $G layout assign -z dc1 -c 1G "$NODE"
  $G layout apply --version 1
else
  echo "[init] layout already applied."
fi

# 2) Import a fixed demo S3 key so the UI can use static credentials.
if $G key info "$ACCESS_KEY" >/dev/null 2>&1; then
  echo "[init] demo key already present."
else
  echo "[init] importing demo S3 key..."
  $G key import "$ACCESS_KEY" "$SECRET_KEY" --yes -n demo-key
fi

# 3) Create a bucket and grant the demo key full access.
$G bucket create "$BUCKET" 2>/dev/null || true
$G bucket allow --read --write --owner "$BUCKET" --key "$ACCESS_KEY" 2>/dev/null || true

echo "[init] ready: bucket '$BUCKET' + key '$ACCESS_KEY'."
