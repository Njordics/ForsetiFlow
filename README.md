# Project Manager (Flask + HTML)

A minimal project/task tracker built with Flask and vanilla HTML/JS. Data is stored locally in SQLite and served from a lightweight API - no front-end build step required.

## Features
- Projects with descriptions and cascading deletes
- Tasks, Backlogs, Sprints, and Resources with basic fields (status, due dates, notes, velocity, etc.)
- Simple HTML UI powered by fetch calls to the REST API
- SQLite database persisted in `instance/project_manager.sqlite` (configurable via `PROJECT_DB`)
- Login page that seeds a single admin user (`forseti` / `flow` by default) and immediately issues a session once the credentials match

## Installation & Running
1) **Prerequisites**: Python 3.11+ and `pip` available in your PATH.
2) **Get the code**: clone or download this repository.
3) **Create a virtual environment**:
   - Windows (PowerShell/CMD): `python -m venv .venv`
   - macOS/Linux (bash): `python -m venv .venv`
4) **Activate the environment**:
   - Windows: `.\.venv\Scripts\activate`
   - macOS/Linux: `source .venv/bin/activate`
5) **Install dependencies**: `pip install -r requirements.txt`
6) **Start the app**:
   - Cross-platform: `python app.py`
   - Windows shortcut: double-click `start_project_manager.bat` (creates/activates `.venv`, installs deps, and starts the server).
7) Open http://127.0.0.1:51001 in your browser.

## Running with Docker

**Docker Compose**: `docker compose up -d` then open <http://127.0.0.1:51001>

**Docker CLI**: `docker run -d -p 51001:51001 -v ./data:/app/instance --name forsetiflow ghcr.io/Njordics/forsetiflow:latest`

Data persists in `./data` directory. See environment variables below for configuration options.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `51001` | Port the Flask server listens on |
| `PROJECT_DATA_DIR` | `/app/instance` | Directory where SQLite database is stored |
| `PROJECT_DB` | `project_manager.sqlite` | SQLite database filename |
| `FLASK_SECRET_KEY` | `dev-secret-key` | Secret key for Flask sessions and cookies |
| `DEFAULT_ADMIN_USERNAME` | `forseti` | Username for the seeded administrator account |
| `DEFAULT_ADMIN_PASSWORD` | `flow` | Initial password for the seeded administrator account |
| `DEFAULT_ADMIN_EMAIL` | *(not set)* | Email stored for the seeded admin (set `DEFAULT_ADMIN_EMAIL` to override) |
| `DEFAULT_ADMIN_PHONE` | `0000000000` | Phone number stored for the seeded admin (shown when setting up MFA) |
| `DEFAULT_ADMIN_COUNTRY` | `1` | Country code stored for the seeded admin phone number |
| `MFA_ISSUER` | `Forseti Flow` | Issuer name displayed to authenticator apps when scanning the QR code |

## User setup

Each initialization deletes every row from the `users` table and recreates the seeded administrator with the credentials and contact fields defined by `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PHONE`, and `DEFAULT_ADMIN_COUNTRY` (defaults: `forseti` / `flow`, email unset, `0000000000`, and `1`). Because the default admin is the only persisted account, the registration UI and `/api/users` endpoint cannot produce lasting extra users—modify the environment variables before starting the server if you need different credentials.
On first login the admin is redirected to `/account`, which now shows a QR code and manual secret for Google/Microsoft Authenticator. Completing the username/password change and entering the 6-digit code from the authenticator app stores the new OTP secret and unlocks `/app`.

## Authentication flow

- Send `POST /api/auth/start` with `{ "identifier": "forseti", "password": "flow" }` (or whatever username/password you configured).
- Include `totp_code` when the account already has an authenticator secret; the endpoint validates the OTP via `pyotp` and opens the session.
- The server validates the credentials, creates a session, and responds with `{"redirect": "/app"}` (or `/account` if the user still requires credential rotation).

## API Overview

- `POST /api/users` – enforced to require a valid session and therefore unusable once the seeded admin exists.
- `POST /api/auth/start` – log in with username/email and password to create a session and receive the redirect target.
- `GET /api/projects`, `POST /api/projects`, and `GET /api/projects/<project_id>` – manage projects.
- `GET /api/projects/<project_id>/tasks`, `POST /api/projects/<project_id>/tasks`, `PATCH /api/tasks/<task_id>`, `DELETE /api/tasks/<task_id>` – manipulate tasks.
- `GET /api/backlogs/<project_id>` / `POST /api/backlogs/<project_id>` and `PATCH`/`DELETE /api/backlog/<item_id>` – handle backlogs.
- `GET /api/sprints/<project_id>` / `POST /api/sprints/<project_id>` and `PATCH`/`DELETE /api/sprint/<sprint_id>` – handle sprints.
- `GET /api/resources/<project_id>` / `POST /api/resources/<project_id>` and `PATCH`/`DELETE /api/resource/<resource_id>` – manage resources.

## Configuration & Data

- Database file: `instance/project_manager.sqlite` (auto-created). Override with `PROJECT_DB=/path/to/db.sqlite`.
- To reset data, stop the app and delete the SQLite file (or point `PROJECT_DB` to a new path).

## Notes
- Debug mode is enabled by default in `app.py`; change `app.run(debug=True)` if needed.
- The HTML/JS frontend lives in `templates/` and `static/`; Flask serves them directly - no build step required.
