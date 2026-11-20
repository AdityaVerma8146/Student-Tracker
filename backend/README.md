# Syllabus Tracker — Spring Boot Backend

Replaces the original Node/Express + SQLite server. Same API surface, an H2
file database instead of SQLite, real BCrypt password hashing instead of the
original's Base64 "hash", and a new `/api/ai/*` endpoint pair backing the
frontend's AI Assistant.

## Requirements

- Java 25+
- Maven 3.9+ (or use your IDE's built-in Maven support)

## Configure

Set environment variables in your shell or deployment settings (Spring Boot
doesn't read `.env` files itself):

```bash
export GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
export GROQ_API_KEY=your-groq-api-key
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USERNAME=you@gmail.com
export SMTP_PASSWORD=your-google-app-password
# Optional; defaults to SMTP_USERNAME
export MAIL_FROM=you@gmail.com
```

On Windows PowerShell, set the same values in the terminal used to start the
backend:

```powershell
$env:SMTP_USERNAME = "you@gmail.com"
$env:SMTP_PASSWORD = "your-google-app-password"
$env:MAIL_FROM = $env:SMTP_USERNAME
```

Google and Groq are optional individually. Gmail SMTP is the default mail
server. For Gmail, enable 2-Step Verification and create a Google App Password;
use that App Password as `SMTP_PASSWORD` (not your normal Gmail password).
Set `SMTP_USERNAME` to the Gmail account that sends the OTP. `MAIL_FROM` is
optional and defaults to `SMTP_USERNAME`. The local console OTP fallback is
disabled by default; it can only be enabled explicitly in the `local` profile.
Set `SESSION_COOKIE_SECURE=true` when serving through HTTPS; leave it false
for local HTTP development. Secure cookies are enabled by default.

- `GOOGLE_CLIENT_ID` enables Google Sign-In.
- `GROQ_API_KEY` enables the AI Assistant.
- `SMTP_USERNAME` and `SMTP_PASSWORD` configure Gmail authentication;
  optionally set `SMTP_HOST`, `SMTP_PORT`, and `MAIL_FROM` to override defaults.

The server uses an HTTP-only session cookie after login. Authenticated API
requests must use that session, and account identity is taken from the
session rather than trusted from caller-supplied email fields.

## Run with Docker

From the repository root:

```bash
docker compose up --build
```

Open `http://localhost:4000`. The Compose service stores H2 data in
`backend/data`, so rebuilding the image does not remove accounts or app data.
Set the environment variables above before starting Compose to enable those
integrations.

## Run locally

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

This starts the API on `http://localhost:4000` and creates a local H2
database file at `backend/data/authdb.mv.db` on first run. Configure
`SMTP_USERNAME` and `SMTP_PASSWORD` to send verification, login, and password
recovery codes through Gmail. With no SMTP credentials, OTP requests fail
with a setup error instead of printing the code to the backend terminal.

The frontend's `vite.config.ts` already proxies `/api/*` to `localhost:4000`
in dev, so `npm run dev` in the `frontend/` folder talks to this server with
no extra configuration.

> **Note:** `mvn spring-boot:run` (and `mvn package`) now also build the
> frontend and bundle it into this server (see "Build a jar" below) — so
> this single command alone serves the whole app at `http://localhost:4000`,
> no separate `npm run dev` required. For active frontend development
> though, keep using `cd frontend && npm run dev` (port 5173) instead — it
> hot-reloads instantly; the bundled build only updates when you restart
> `mvn spring-boot:run`.

## Build a jar

```bash
mvn clean package
java -jar target/backend-2.0.0.jar
```

This `mvn package` also builds `../frontend` and copies its output into
`src/main/resources/static` first (see the `frontend-maven-plugin` /
`maven-resources-plugin` executions in `pom.xml`), so the resulting jar is
the **entire app** — frontend, backend, and AI assistant together, served
from one process. Open `http://localhost:4000` (or whatever `PORT` is set
to) after running the jar and the full site loads, no separate frontend
server needed.

## Deploy everything as one Render Web Service

> ⚠️ Correction from an earlier version of this guide: Render has **no
> native "Java" runtime** for a New Web Service — that option doesn't
> exist, so picking it (or leaving the default) makes Render silently fall
> back to auto-detecting Node.js instead, which fails since there's no
> `package.json` at the repo root. Java/Maven apps on Render go through
> **Docker** — a `Dockerfile` for this is already at `backend/Dockerfile`.

1. **New Web Service** on Render, connect your repo.
2. **Root Directory:** leave this **blank** (repo root) — do **not** set it
   to `backend`. The Docker build needs both `backend/` and `frontend/`
   visible as sibling folders, so the build context must be the repo root.
3. **Runtime/Environment:** select **Docker** (Render should auto-detect
   this once it sees `backend/Dockerfile`; if it doesn't, or if you already
   have a misconfigured service from before this file existed, delete it
   and create a fresh Web Service so Render re-detects from scratch).
4. **Dockerfile Path:** `backend/Dockerfile`
5. Leave **Build Command** and **Start Command** blank — Docker services
   use the Dockerfile's own build steps and `ENTRYPOINT` instead, there's
   nothing to fill in there.
6. **Environment variables** (Settings → Environment):
   - `GROQ_API_KEY` — required for the AI Assistant. Get one free at
     https://console.groq.com/keys. This is separate from any value you've
     set locally on your own machine — Render has its own environment.
   - `GOOGLE_CLIENT_ID` — optional, only needed if you use Google sign-in.
    - `SMTP_USERNAME` and `SMTP_PASSWORD` — Gmail account and App Password
      used for signup verification, email-code login, and password recovery.
      Optionally set `SMTP_HOST`, `SMTP_PORT`, and `MAIL_FROM` to override
      the Gmail defaults.
    - `SESSION_COOKIE_SECURE=true` — set this because the public app is served
       over HTTPS.
   - Render sets `PORT` itself automatically; `application.properties`
     already reads it (`server.port=${PORT:4000}`), nothing to do there.
7. **Persistent disk (important):** this backend stores its database as a
   local H2 file (`DB_PATH`, default `./data/authdb`). Render's free-tier
   disk is wiped on every restart/redeploy, which would silently delete all
   signups/groups/diary entries. Add a Render **Disk** (Settings → Disks),
   mount it at e.g. `/opt/render/project/data`, and set the `DB_PATH`
   environment variable to a path inside it (e.g.
   `/opt/render/project/data/authdb`) — or switch to Render's free managed
   Postgres for real production use.
8. Deploy. The first build takes a few minutes (Maven Central + npm
   downloads + a full frontend build all happen inside the Docker build).
   Render gives you one URL (e.g. `https://your-app.onrender.com`) that
   serves the whole site — frontend, API, and AI assistant together. No
   `VITE_API_URL`, no CORS setup, no second service needed.

## Validation

Run `mvn test` from `backend/` and `npm run typecheck` from `frontend/` before
deploying. The image build can be exercised from the repository root with
`docker compose build`.

## API

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/signup` | `{email, password, mood?}` | Requires verified email OTP; 201, `{email, mood}` |
| POST | `/api/login` | `{email, password}` | Sets an HTTP-only session cookie; `{email, mood, data}` |
| POST | `/api/google-login` | `{idToken}` | Verifies via Google's `tokeninfo` endpoint and sets a session |
| POST | `/api/logout` | — | Invalidates the current session |
| POST | `/api/send-otp` | `{email}` | Sends a 10-minute email verification code |
| POST | `/api/verify-otp` | `{email, otp}` | Verifies the code for signup or recovery |
| POST | `/api/login-otp` | `{email, otp}` | Consumes code and sets a session |
| POST | `/api/reset-password` | `{email, newPassword}` | Requires verified email OTP; `{email, message}` |
| GET | `/api/user-data?email=` | — | `{data}` |
| POST | `/api/user-data` | `{email, data}` | `{email, message}` |
| POST | `/api/ai/correct` | `{text}` | `{corrected, changed, explanation?}` |
| POST | `/api/ai/schedule` | `{prompt, startDate, context?}` | `{summary, tasks: [{date, title, category}]}` |
| GET | `/api/users/search?query=&excludeEmail=` | — | `PublicProfile[]` |
| POST | `/api/friends/request` | `{fromEmail, toEmail}` | — |
| POST | `/api/friends/respond` | `{friendshipId, byEmail, accept}` | — |
| GET | `/api/friends?email=` | — | `PublicProfile[]` (accepted friends) |
| GET | `/api/friends/requests?email=` | — | `FriendRequestView[]` (incoming pending) |
| DELETE | `/api/friends?email=&friendEmail=` | — | — |
| GET | `/api/groups?email=` | — | `GroupSummary[]` (groups you're in) |
| POST | `/api/groups` | `{leaderEmail, name, description}` | `GroupSummary`, 201 |
| GET | `/api/groups/{id}?email=` | — | `GroupDetail` (members ranked + tasks) |
| DELETE | `/api/groups/{id}?email=` | — | leader only |
| POST | `/api/groups/{id}/members` | `{byEmail, memberEmail}` | leader adds an accepted friend |
| DELETE | `/api/groups/{id}/members/{memberEmail}?email=` | — | self-leave or leader-remove |
| POST | `/api/groups/{id}/tasks` | `{createdByEmail, title, description, assignedToEmail?, dueDate?}` | leader can assign to anyone; members only to themselves/open |
| PATCH | `/api/groups/{id}/tasks/{taskId}/toggle` | `{email}` | assignee, creator, or leader |
| DELETE | `/api/groups/{id}/tasks/{taskId}?email=` | — | creator or leader |
| GET | `/api/badges?email=` | — | `BadgeView[]` (all badges, `earned` flag per one) |
| POST | `/api/feedback` | `{fromEmail, type, subject, message}` | `type` is `CONTACT` or `BUG_REPORT` |

All errors come back as `{"error": "message"}` with an appropriate HTTP
status, matching what the frontend already expects.
