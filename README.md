# helden-pipeline

Erstes MEOS-Modul, das die Deploy-Pipeline validiert.

- **GitHub:** github.com/01MEwood/helden-pipeline
- **Docker Hub:** `mariomeosv40/helden-pipeline-frontend`, `mariomeosv40/helden-pipeline-backend`
- **Live-URL:** https://helden-pipeline.meosapp.de
- **API:** https://helden-pipeline.meosapp.de/api
- **Reverse Proxy:** nginx-proxy-manager (NPM) via gemeinsames Docker-Netzwerk `meos-shared`
- **Backend-Port (intern):** `4100` — eigener Port für dieses Modul, um Verwechslungen mit anderen MEOS-Backends auf 4000 zu vermeiden. Ist nur containerintern, wird **nicht** auf den Host gemappt.

---

## Einmaliges VPS-Setup (nur 1× — gilt für alle künftigen MEOS-Module)

Damit NPM die neuen Stacks per Container-Name erreichen kann, brauchen wir ein gemeinsames Docker-Netzwerk.

1. **Hostinger Docker Manager → Terminal** öffnen
2. NPM-Container-Namen bestätigen:
   ```bash
   docker ps --format "{{.Names}}" | grep nginx-proxy-manager
   ```
   Erwartet: `nginx-proxy-manager-gxkd` (falls anders → in den Befehlen unten anpassen)
3. Netzwerk anlegen + NPM verbinden + NPM neustarten:
   ```bash
   docker network create meos-shared
   docker network connect meos-shared nginx-proxy-manager-gxkd
   docker restart nginx-proxy-manager-gxkd
   ```
4. Verifizieren:
   ```bash
   docker network inspect meos-shared | grep nginx-proxy-manager
   ```
   → muss den NPM-Container zeigen.

**Diesen Schritt machst du nur ein einziges Mal.** Danach gilt er für alle MEOS-Module.

---

## Setup helden-pipeline (Schritt-für-Schritt mit deinen offenen Browser-Tabs)

> Hinweis: Das Repo `01MEwood/helden-pipeline` existiert bereits. Du hast entschieden, den vorhandenen Inhalt zu überschreiben. Falls du noch Code aus dem alten Stand brauchst, ziehe ihn dir vorher als Backup.

### Schritt 1 — Docker Hub Repos anlegen

Tab **hub.docker.com** (eingeloggt als `mariomeosv40`):

1. **Create Repository** → Name: `helden-pipeline-frontend` → Public/Private nach Wahl → **Create**
2. Wiederholen: `helden-pipeline-backend`

### Schritt 2 — Docker Hub Access Token (falls noch nicht vorhanden)

1. **Account Settings → Security → New Access Token**
2. Description: `github-actions-01MEwood`
3. Permissions: **Read, Write, Delete**
4. Token kopieren (siehst du nur einmal!)

### Schritt 3 — GitHub Secret setzen

Tab **github.com/01MEwood/helden-pipeline**:

1. **Settings → Secrets and variables → Actions**
2. **New repository secret**
3. Name: `DOCKERHUB_TOKEN`, Value: Token aus Schritt 2 → **Add secret**

### Schritt 4 — Code force-pushen

```bash
cd helden-pipeline
git init
git add .
git commit -m "deploy: hostinger pipeline via mariomeosv40 + npm"
git branch -M main
git remote add origin git@github.com:01MEwood/helden-pipeline.git
git push -u origin main --force
```

→ GitHub Actions startet automatisch.
   Tab **GitHub → Actions** öffnen, ~3-5 min warten.
   Erfolg: Beide Images sind auf hub.docker.com/r/mariomeosv40 sichtbar.

### Schritt 5 — DNS A-Record

Tab **Hostinger → Domains → meosapp.de → DNS**:

1. **Add Record**
   - Type: **A**
   - Name: `helden-pipeline`
   - Points to: `31.97.122.6`
   - TTL: 3600
2. **Save** — parallel mit Schritt 6 weitermachen (DNS propagiert ~5-15 min).

### Schritt 6 — Hostinger Docker Manager Stack

Tab **Hostinger → VPS → srv1042525 → Docker Manager**:

1. **Compose ▼ → Create new Stack**
2. Stack name: `helden-pipeline`
3. **Web editor** wählen
4. Inhalt von `deploy/docker-compose.hostinger.yml` (in diesem Repo) komplett einfügen
5. Im Bereich **Environment variables** unten eintragen:
   ```
   DB_NAME=helden_pipeline
   DB_USER=helden_pipeline_user
   DB_PASSWORD=<starkes Passwort, mind. 24 Zeichen>
   JWT_SECRET=<zufälliger 64-Zeichen-String>
   ```
   Tipp: `openssl rand -base64 48` für JWT_SECRET im Terminal.
6. **Deploy the stack**
7. Nach ~60-90 s sollten alle 3 Container `running / healthy` sein.

### Schritt 7 — nginx-proxy-manager Proxy Host

NPM Web-UI öffnen (ist im Hostinger Docker Manager unter `nginx-proxy-manager-gxkd` → **Öffnen**).

1. **Hosts → Proxy Hosts → Add Proxy Host**
2. **Tab "Details":**
   | Feld | Wert |
   |---|---|
   | Domain Names | `helden-pipeline.meosapp.de` |
   | Scheme | `http` |
   | Forward Hostname / IP | `helden-pipeline-frontend` |
   | Forward Port | `80` |
   | Cache Assets | ✅ |
   | Block Common Exploits | ✅ |
   | Websockets Support | ✅ |
3. **Tab "Custom locations" → Add location:**
   | Feld | Wert |
   |---|---|
   | location | `/api` |
   | Scheme | `http` |
   | Forward Hostname / IP | `helden-pipeline-backend` |
   | Forward Port | `4100` |
4. **Tab "SSL":**
   | Feld | Wert |
   |---|---|
   | SSL Certificate | **Request a new SSL Certificate** |
   | Force SSL | ✅ |
   | HTTP/2 Support | ✅ |
   | HSTS Enabled | ✅ |
   | Email Address | deine Mail |
   | I Agree to Let's Encrypt ToS | ✅ |
5. **Save**

### Schritt 8 — Smoke Test

Im Browser:

| URL | Erwartung |
|---|---|
| https://helden-pipeline.meosapp.de/api/health | `{"status":"ok","timestamp":"..."}` |
| https://helden-pipeline.meosapp.de | Frontend lädt, kein Mixed-Content |

Falls 502 → 60 s warten (NPM braucht kurz nach SSL-Issue), dann erneut.
Falls weiterhin 502 → im Hostinger Docker Manager prüfen, ob alle 3 Container `healthy` sind.

---

## Update-Workflow (ab jetzt)

```bash
git add . && git commit -m "feat: …" && git push
```

→ GitHub Actions baut & pusht zu `mariomeosv40/helden-pipeline-{frontend,backend}:latest` (+ SHA-Tag, + Build-Nummer).
→ Hostinger Docker Manager → Stack `helden-pipeline` → **Recreate** (zieht `latest` neu).
→ Live in <2 min. NPM Proxy Host bleibt unverändert.

---

## Was noch fehlt: der App-Code

Dieses Repo ist die **Deployment-Hülle**. Für einen erfolgreichen Build brauchen `frontend/` und `backend/` noch echten Code:

- **`frontend/`** braucht: `package.json`, `vite.config.js`, `index.html`, `src/App.jsx`, `src/main.jsx`
- **`backend/`** braucht: `package.json`, `index.js` mit `app.get('/health', ...)`, `prisma/schema.prisma`

Sag Bescheid, wenn ich dir den App-Code dazubauen soll — dafür brauche ich nur kurz zu wissen, was die helden-pipeline fachlich tun soll.

---

## Architektur

```
    Browser ─HTTPS:443─► nginx-proxy-manager ──┐
                                                │  docker network: meos-shared
                                ┌───────────────┴────────────────┐
                                ▼                                ▼
                      helden-pipeline-frontend        helden-pipeline-backend
                          (nginx :80)                     (express :4100)
                                                                │
                                                                ▼
                                                      helden-pipeline-db
                                                       (postgres :5432)
```
