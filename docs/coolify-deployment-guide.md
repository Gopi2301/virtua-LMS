# VirtuaLMS Coolify Deployment Guide (Unified Docker Compose)

This guide walks you through deploying the entire **VirtuaLMS** platform (PostgreSQL, Redis, NestJS API, Learner Web, and Admin Console) to [Coolify](https://coolify.io) using the unified Docker Compose configuration.

---

## 1. Overview of Deployment Assets

The following deployment assets have been prepared in your repository:

- [`docker-compose.prod.yml`](../docker-compose.prod.yml): The production multi-container compose file orchestrating PostgreSQL, Redis, API, Learner Web, and Admin Console.
- [`docker/Dockerfile.api`](../docker/Dockerfile.api): Multi-stage Dockerfile for NestJS, compiling Prisma client, bundling source code, and preparing static uploads.
- [`docker/Dockerfile.web`](../docker/Dockerfile.web): Multi-stage Dockerfile compiling the Learner React SPA and serving it via Nginx.
- [`docker/Dockerfile.admin`](../docker/Dockerfile.admin): Multi-stage Dockerfile compiling the Admin Console React SPA and serving it via Nginx.
- [`docker/nginx.conf`](../docker/nginx.conf): Nginx configuration with gzip compression, asset caching, and SPA client-side routing fallback (`try_files $uri $uri/ /index.html;`).
- [`docker/entrypoint.api.sh`](../docker/entrypoint.api.sh): Startup script that waits for Postgres, synchronizes the Prisma database schema, and boots NestJS.
- [`.dockerignore`](../.dockerignore): Excludes local `node_modules`, `dist`, `.env`, and build caches from the Docker context.

---

## 2. Domains & Networking Architecture

When deployed, Coolify's built-in Traefik reverse proxy will automatically handle SSL certificates (via Let's Encrypt) and route incoming traffic:

| Subdomain (Example) | Container | Target Port | Description |
| :--- | :--- | :--- | :--- |
| `https://api.yourdomain.com` | `api` | `4000` | NestJS REST API & Swagger (`/api/docs`) |
| `https://learn.yourdomain.com` | `web` | `80` | Learner Portal |
| `https://admin.yourdomain.com` | `admin` | `80` | Admin Console |
| *Internal Only* | `db` | `5432` | PostgreSQL database |
| *Internal Only* | `redis` | `6379` | Redis cache & queue |

---

## 3. Pre-Deployment: Keycloak Configuration

Before users can log in on the production URLs, update your Keycloak client:

1. Log into your Keycloak Admin Console: `https://keycloak.expertisorjobs.com`
2. Select Realm: **`virtualogin`**
3. Navigate to **Clients** > **`virtua-lms`**
4. Update the following fields:
   - **Valid redirect URIs**:
     - `https://learn.yourdomain.com/*`
     - `https://admin.yourdomain.com/*`
   - **Web Origins (CORS)**:
     - `https://learn.yourdomain.com`
     - `https://admin.yourdomain.com`
5. Click **Save**.

---

## 4. Deploying in Coolify (Step-by-Step)

### Step 1: Create a New Resource in Coolify
1. Log in to your Coolify dashboard.
2. Select your **Project** and **Environment** (e.g. `Production`).
3. Click **+ New Resource** and select **Docker Compose**.
4. Choose **Git Repository** (GitHub / GitLab / Custom Git) and select your `virtua_LMS` repository and branch (e.g., `main`).

### Step 2: Set the Compose File Path
In the Coolify resource settings:
- **Base Directory**: `/`
- **Docker Compose Location**: `docker-compose.prod.yml`

### Step 3: Configure Environment Variables
In the **Environment Variables** tab of your Docker Compose resource in Coolify, add:

```ini
# --- Database Credentials ---
POSTGRES_USER=virtua_user
POSTGRES_PASSWORD=your_secure_db_password_here
POSTGRES_DB=virtua_lms

# --- API Domain & URL ---
# This URL is compiled into the Web and Admin frontends at build time:
VITE_API_URL=https://api.yourdomain.com/api

# --- Keycloak Auth ---
KEYCLOAK_URL=https://keycloak.expertisorjobs.com
KEYCLOAK_REALM=virtualogin
KEYCLOAK_CLIENT_ID=virtua-lms
```

> [!IMPORTANT]
> Because Vite embeds `VITE_API_URL` during the frontend build step, ensure `VITE_API_URL` is set in Coolify **before** triggering the initial deployment.

### Step 4: Configure Domains in Coolify
In the Coolify resource dashboard:
1. Navigate to the **Services** section. Coolify will list `api`, `web`, and `admin`.
2. Set the **FQDN (Domains)** for each service:
   - **For `api`**: `https://api.yourdomain.com`
   - **For `web`**: `https://learn.yourdomain.com`
   - **For `admin`**: `https://admin.yourdomain.com`

### Step 5: Persistent Storage for Uploads
The Docker Compose file automatically creates a named volume `api_uploads` mounted to `/app/apps/api/uploads`.
This guarantees that uploaded course materials, thumbnails, and attachments remain safe when containers are restarted or rebuilt.

### Step 6: Deploy
Click **Deploy** in the top right corner of Coolify.
1. Coolify will clone the repository.
2. It will build `Dockerfile.api`, `Dockerfile.web`, and `Dockerfile.admin`.
3. PostgreSQL and Redis will start and pass health checks.
4. The `entrypoint.api.sh` script will run `prisma db push` to synchronize your database tables.
5. Traefik will automatically issue Let's Encrypt SSL certificates for your 3 domains.

---

## 5. Post-Deployment Verification

1. **API Health & Documentation**:
   - Visit `https://api.yourdomain.com/api/docs` to verify Swagger is accessible.
2. **Learner Portal**:
   - Visit `https://learn.yourdomain.com` and test the Keycloak login flow.
   - Refresh a deep route (e.g. `/courses`) to ensure Nginx SPA routing works without 404s.
3. **Admin Console**:
   - Visit `https://admin.yourdomain.com` and log in with an admin or author account.
4. **Logs**:
   - Inspect the `api` container logs in Coolify to confirm successful database connectivity and Prisma schema sync.
