# Troubleshooting: Dashboard stuck on "Loading…"

> **TL;DR (RU):** GUI зависает на «Loading…» когда **не может достучаться до Garage Admin API**.
> Проверьте, что: (1) в `garage.toml` включён блок `[admin]` с `admin_token`; (2) применён layout
> кластера (`garage layout assign` + `garage layout apply`); (3) в `.env.local` указан верный
> `GARAGE_ADMIN_URL` и **тот же** `GARAGE_ADMIN_TOKEN`; (4) порт `3903` доступен с машины, где
> запущен GUI. Команда для проверки внизу.

This guide fixes the two ways the dashboard fails to load. Both are **configuration/setup
issues**, not bugs in the UI — verified against **Garage v2.2.0** with the UI driven end-to-end.

| Symptom | Root cause |
|---|---|
| Sidebar renders, content stuck on **`Loading…`** forever | The UI **cannot reach the Garage Admin API** (wrong URL, admin API not enabled, wrong token, or firewall). The request hangs, so the page never leaves the loading state. |
| Red error box: **`Garage Admin API error 500: … "Layout not ready"`** | The cluster **layout has not been applied** — `ListBuckets`/`ListKeys` return 500 until you assign a role to the node and apply the layout. |

The UI is just a client of Garage's Admin API (`/v2/...`). Every page needs that API reachable and the cluster operational.

---

## Step 0 — Diagnose first (one command)

From the **machine where the UI runs**, with the **same** values you put in `.env.local`:

```bash
ADMIN_URL=http://localhost:3903          # your GARAGE_ADMIN_URL
ADMIN_TOKEN=your-admin-token-here        # your GARAGE_ADMIN_TOKEN

curl -s -o /dev/null -w "GetClusterStatus -> HTTP %{http_code}\n" \
  -H "Authorization: Bearer $ADMIN_TOKEN" "$ADMIN_URL/v2/GetClusterStatus"

curl -s -w "\nListBuckets -> HTTP %{http_code}\n" \
  -H "Authorization: Bearer $ADMIN_TOKEN" "$ADMIN_URL/v2/ListBuckets"
```

Interpret the result:

- **`curl` hangs / times out / "Connection refused" / "Could not resolve host"** → the admin API is
  not reachable → this is why the GUI shows `Loading…`. Go to **Fix A** and **Fix C**.
- **`GetClusterStatus` = 200 but `ListBuckets` = 500 `Layout not ready`** → go to **Fix B**.
- **`401 Unauthorized`** → token mismatch → go to **Fix A** (token section).
- **All `200`** → the backend is fine; the problem is the UI's `.env.local` (Fix C) — most often a
  Docker `localhost` mistake.

---

## Fix A — Enable the Admin API in `garage.toml`

The admin API is **off unless you configure it**. Add this block and restart Garage:

```toml
[admin]
api_bind_addr = "[::]:3903"          # bind on all interfaces so the UI host can reach it
admin_token   = "a-long-random-secret"   # generate: openssl rand -hex 16
```

- The `admin_token` here must **exactly match** `GARAGE_ADMIN_TOKEN` in the UI's `.env.local`.
- Restart Garage after editing. Confirm the log line: `Admin API server listening on http://[::]:3903`.

## Fix B — Apply the cluster layout

A freshly-started node has **NO ROLE ASSIGNED** and `ListBuckets`/`ListKeys` return
`500 "Layout not ready"`. Assign a role and apply:

```bash
# 1. Find the node id
garage status
#   ID                Hostname  ...  Capacity
#   f8222f7a3034a535  ...            NO ROLE ASSIGNED   <-- needs a role

# 2. Assign a zone + capacity to that node id (use your real id + disk size)
garage layout assign -z dc1 -c 1G f8222f7a3034a535

# 3. Commit it
garage layout apply --version 1

# 4. Verify
garage status            # node should now show a capacity, not "NO ROLE ASSIGNED"
```

(If you run Garage in Docker, prefix with `docker exec <container> /garage ...`.)

## Fix C — Point the UI at a reachable admin API (`.env.local`)

```dotenv
GARAGE_ADMIN_URL=http://localhost:3903
GARAGE_ADMIN_TOKEN=a-long-random-secret      # must match [admin] admin_token above

GARAGE_S3_ENDPOINT=http://localhost:3900
GARAGE_S3_ACCESS_KEY=GK...                    # from: garage key create my-app-key
GARAGE_S3_SECRET_KEY=...                       # from: garage key info my-app-key --show-secret
GARAGE_S3_REGION=garage
```

Common mistakes:

- **Running the UI in Docker/another host and using `localhost`.** `localhost` inside the UI
  container is the *container itself*, not the Garage host. Use the Garage host's reachable address
  (e.g. `http://<garage-host-ip>:3903` or a Docker network/service name), and make sure Garage's
  `api_bind_addr` is `[::]:3903` (not `127.0.0.1`).
- **Firewall** dropping packets to `3903` → causes the exact `Loading…` hang (the request never
  gets a response). Open the port between the UI and Garage.
- Restart the UI (`npm run dev` / rebuild) after changing `.env.local` — env vars are read at start.

---

## Create an S3 key + bucket (so the dashboard has data)

```bash
garage key create my-app-key
garage key info my-app-key --show-secret     # copy Key ID (GK...) + Secret into .env.local
garage bucket create photos
garage bucket allow --read --write --owner photos --key GK...
```

## Verify it's fixed

Reload the GUI. The dashboard should show **Buckets / API Keys / Storage Used / Node Status:
Healthy** (verified working against Garage v2.2.0). If it still spins on `Loading…`, re-run **Step 0** —
the admin API is still unreachable from the UI's host.

---

## Note for maintainers (optional code hardening)

The `Loading…` hang happens because `src/lib/garage-admin.ts` calls `fetch()` with **no timeout**, and
the dashboard only shows an error if the request *returns*. When the admin API is unreachable and
silently drops packets, the request hangs and the user sees `Loading…` indefinitely with no hint.

Recommended: add an `AbortSignal.timeout(8000)` to `adminFetch`, and surface connection failures as a
clear error (e.g. "Cannot reach Garage Admin API at <URL> — check GARAGE_ADMIN_URL / firewall / token")
instead of an endless spinner.
