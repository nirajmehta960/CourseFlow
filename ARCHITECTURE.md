# CourseFlow — Architecture & Deployment

CourseFlow is a full-stack **Learning Management System (LMS)** deployed on **Amazon EC2**, with **GitHub Actions** driving continuous integration and deployment. This document describes the system architecture, deployment topology, and CI/CD pipeline in detail.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Deployment Architecture (AWS EC2)](#deployment-architecture-aws-ec2)
4. [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
5. [Application Architecture](#application-architecture)
6. [Request Flow & Data Flow](#request-flow--data-flow)
7. [Backend Architecture](#backend-architecture)
8. [Frontend Architecture](#frontend-architecture)
9. [Security & Network](#security--network)
10. [External Dependencies](#external-dependencies)
11. [Summary Tables](#summary-tables)

---

## Executive Summary

| Aspect | Description |
|--------|-------------|
| **Application** | SPA (React) + REST API (Spring Boot); JWT auth; MongoDB + AWS S3. |
| **Deployment** | Single **Amazon EC2** instance (e.g. Ubuntu 24.04 LTS ARM64, t4g.small). |
| **Runtime** | **Docker Compose**: two containers — **frontend** (Nginx on port 80), **backend** (Spring Boot on port 4000). |
| **CI/CD** | **GitHub Actions**: on push to `main` → build backend & frontend → build Docker images → push to **GitHub Container Registry (GHCR)** → SSH to EC2 → pull images, re-tag, restart containers. |
| **External** | **MongoDB Atlas** (database), **AWS S3** (file uploads). |

Users reach the app via the EC2 public IP or domain; Nginx serves the SPA and proxies `/api/*` to the backend container. All secrets (MongoDB, AWS, JWT) live in `backend/.env` on the server and are not in the repo.

---

## System Architecture Diagram

End-to-end flow from user browser to external services:

```
                                    INTERNET
                                        │
                                        │ HTTPS (optional) or HTTP
                                        │ Port 80 (or 443 if TLS in front)
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                         AMAZON EC2 INSTANCE (e.g. t4g.small, Ubuntu 24.04 ARM64)      │
│                                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│   │                        DOCKER HOST (Docker Engine)                               │ │
│   │                                                                                  │ │
│   │   ┌─────────────────────────────┐     ┌─────────────────────────────┐           │ │
│   │   │  courseflow-frontend         │     │  courseflow-backend          │           │ │
│   │   │  (Nginx Alpine)              │     │  (Eclipse Temurin 21 JRE)    │           │ │
│   │   │                              │     │                              │           │ │
│   │   │  Port: 80 (mapped to host)   │────▶│  Port: 4000 (internal)       │           │ │
│   │   │  • Serves static SPA        │     │  • Spring Boot 3.2          │           │ │
│   │   │  • Proxy /api/ → backend     │     │  • Context path: /api        │           │ │
│   │   │  • try_files → index.html    │     │  • JWT, REST, MongoDB        │           │ │
│   │   └─────────────────────────────┘     └──────────────┬────────────────┘           │ │
│   │                                                      │                            │ │
│   └─────────────────────────────────────────────────────┼────────────────────────────┘ │
│                                                          │                              │
└──────────────────────────────────────────────────────────┼──────────────────────────────┘
                                                           │
                     ┌──────────────────────────────────────┼──────────────────────────────────────┐
                     │                                      │                                      │
                     ▼                                      ▼                                      ▼
          ┌─────────────────────┐              ┌─────────────────────┐              ┌─────────────────────┐
          │  MongoDB Atlas      │              │  AWS S3              │              │  Redis (Cache/PubSub)│
          │  (Managed MongoDB)   │              │  (File storage for   │              │  • Port: 6379        │
          │  • CourseFlow DB     │              │   assignment uploads)│              │  • WebSocket Broker  │
          │  • Connection string │              │  • courseflow-uploads│              └─────────────────────┘
          │    in backend/.env   │              │  • IAM / env keys    │
          └─────────────────────┘              └─────────────────────┘
```

**Client (not shown above):** User’s browser loads the SPA from `http://<EC2-IP>/` (or a domain pointing to EC2). All API calls go to the same origin `/api/...`, which Nginx proxies to `http://courseflow-backend:4000/api/...` inside Docker.

---

## Deployment Architecture (AWS EC2)

How the app is deployed on a single EC2 instance:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  AWS CLOUD                                                                               │
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Region (e.g. us-east-1)                                                            │  │
│  │                                                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  VPC / Subnet                                                                  │  │  │
│  │  │                                                                                │  │  │
│  │  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  │  EC2 Instance (e.g. t4g.small, Ubuntu 24.04 LTS ARM64)                    │  │  │
│  │  │  │  • Public IP or Elastic IP                                                │  │  │
│  │  │  │  • Security Group: Inbound 80 (HTTP), 22 (SSH), optionally 4000 (API)    │  │  │
│  │  │  │                                                                            │  │  │
│  │  │  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │  │  Docker Compose                                                     │  │  │  │
│  │  │  │  │                                                                     │  │  │  │
│  │  │  │  │  network: courseflow-network (bridge)                                │  │  │  │
│  │  │  │  │  ┌─────────────────────┐    ┌─────────────────────┐                │  │  │  │
│  │  │  │  │  │  frontend           │    │  backend             │                │  │  │  │
│  │  │  │  │  │  ports: "80:80"     │    │  ports: "4000:4000"  │                │  │  │  │
│  │  │  │  │  │  depends_on:        │    │  expose: 4000       │                │  │  │  │
│  │  │  │  │  │    backend (healthy)│    │  healthcheck:       │                │  │  │  │
│  │  │  │  │  │  healthcheck: /     │    │    GET /api/health   │                │  │  │  │
│  │  │  │  │  │  restart: unless-   │    │  restart: unless-   │                │  │  │  │
│  │  │  │  │  │    stopped          │    │    stopped          │                │  │  │  │
│  │  │  │  │  └──────────┬──────────┘    └──────────┬──────────┘                │  │  │  │
│  │  │  │  │               │  proxy_pass /api/       │                           │  │  │  │
│  │  │  │  │               └────────────────────────┘                           │  │  │  │
│  │  │  │  └─────────────────────────────────────────────────────────────────────┘  │  │  │
│  │  │  │                                                                            │  │  │
│  │  │  │  Host files: ~/CourseFlow/docker-compose.yml, ~/CourseFlow/backend/.env    │  │  │
│  │  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │  └────────────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Deployment details:**

- **EC2**: One instance; recommended Ubuntu 24.04 LTS ARM64 (e.g. t4g.small for free-tier eligibility). Docker and Docker Compose are installed on the host.
- **Images**: Built by GitHub Actions and stored in **GitHub Container Registry (GHCR)**. On deploy, the workflow SSHs into EC2, pulls images from GHCR, re-tags them as `courseflow-backend:latest` and `courseflow-frontend:latest`, then runs `docker-compose up -d --remove-orphans` (no full down for less downtime). A health-check loop verifies both services become healthy; on failure the workflow rolls back to the previous `:stable` images.
- **Docker Compose**: Uses a dedicated **bridge network** (`courseflow-network`) so frontend and backend resolve by service name (`courseflow-backend`). Backend has a **healthcheck** (`GET /api/health` via curl every 20s); frontend **depends_on backend** with `condition: service_healthy`, so Nginx only starts after the API is ready. Frontend healthcheck pings `http://localhost/` every 30s.
- **Nginx (frontend container)**: Listens on port 80; serves static files from `/usr/share/nginx/html` (Vite build output); `location /api/` proxies to `http://courseflow-backend:4000/api/`. So the browser only talks to port 80; `/api` is reverse-proxied to the backend.
- **Backend container**: Exposes port 4000; `expose: 4000` for the network. Reads config from `backend/.env` (MongoDB URI, AWS keys, JWT secret, CORS, etc.). Exposes **`GET /api/health`** (unauthenticated) for Docker and load balancers.

---

## CI/CD Pipeline (GitHub Actions)

Pipeline runs on **push to `main`**. Two jobs: **build-and-push** (build artifacts, build images, push to GHCR) and **deploy** (SSH to EC2, pull, re-tag, restart).

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  GITHUB                                                                                  │
│                                                                                          │
│  Trigger: push → main                                                                    │
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │  JOB 1: build-and-push (runs-on: ubuntu-latest)                                     │  │
│  │                                                                                     │  │
│  │  1. Checkout repository                                                            │  │
│  │  2. Log in to GitHub Container Registry (ghcr.io) with GITHUB_TOKEN                  │  │
│  │  3. Set up Java 21 (Temurin), cache Maven                                          │  │
│  │  4. Build Backend: cd backend && mvn clean package -DskipTests                       │  │
│  │  5. Set up Node 20, cache npm (frontend/package-lock.json)                           │  │
│  │  6. Build Frontend: cd frontend && VITE_API_BASE_URL=/api npm run build             │  │
│  │  7. Set up QEMU + Docker Buildx (for multi-platform)                                │  │
│  │  8. Build & push Backend image → ghcr.io/<org>/<repo>/backend:latest (linux/arm64)  │  │
│  │  9. Build & push Frontend image → ghcr.io/<org>/<repo>/frontend:latest (linux/arm64)│  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                               │
│                                          │ needs: build-and-push                          │
│                                          ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │  JOB 2: deploy (runs-on: ubuntu-latest)                                            │  │
│  │                                                                                     │  │
│  │  1. SSH into EC2 (secrets: EC2_HOST, EC2_USER, EC2_KEY)                            │  │
│  │  2. Login to GHCR on server (GITHUB_TOKEN, GITHUB_ACTOR)                            │  │
│  │  3. Clone repo to ~/CourseFlow if not exists; git pull origin main                  │  │
│  │  4. Ensure backend/.env exists (touch)                                             │  │
│  │  5. docker pull ghcr.io/.../backend:latest and frontend:latest                      │  │
│  │  6. docker tag ... backend:latest → courseflow-backend:latest                       │  │
│  │     docker tag ... frontend:latest → courseflow-frontend:latest                      │  │
│  │  7. Backup current images to :stable (for rollback)                                 │  │
│  │  8. Tag GHCR images → courseflow-backend:latest, courseflow-frontend:latest         │  │
│  │  9. docker-compose up -d --remove-orphans (no down = less downtime)                  │  │
│  │ 10. Health check loop: poll until both services report healthy (up to 12×5s)        │  │
│  │ 11. If unhealthy: rollback to :stable, force-recreate, exit 1                      │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**GitHub secrets required:**

| Secret    | Purpose |
|-----------|---------|
| `EC2_HOST` | EC2 public IP or DNS (e.g. `54.123.45.67`). |
| `EC2_USER` | SSH user (e.g. `ubuntu` for Ubuntu, `ec2-user` for Amazon Linux). |
| `EC2_KEY`  | Full private key (.pem) content for SSH. |

**Registry:** Images are stored in **GitHub Container Registry (GHCR)** at `ghcr.io/<owner>/<repository>/backend:latest` and `frontend:latest`. Workflow permissions must allow **Read and write** for packages so the job can push images.

**Why build JAR/frontend in CI then Docker:** Backend Dockerfile expects a pre-built `target/*.jar`; frontend Dockerfile expects a pre-built `dist/`. So the workflow builds with Maven/Node on the runner, then Docker build only copies artifacts (no Java/Node in the image build context on the runner for the final image), keeping images small and fast.

---

## Application Architecture

Logical layers of the application (independent of deployment):

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Browser)                                                             │
│  • React 18 + TypeScript + Vite                                                           │
│  • React Router, TanStack Query, React Hook Form, Zod                                      │
│  • shadcn/ui + Tailwind; AuthContext, ProtectedRoute                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ REST (JSON), JWT in Authorization header
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  API LAYER (Spring Boot)                                                                  │
│  • Controllers: / (root API info), /health, /auth, /courses, /assignments, /grades,       │
│    /api/gradebook (overrides), /quizzes, /modules, /discussions, /inbox,                  │
│    /notifications, /calendar, /users, /files                                               │
│  • GlobalExceptionHandler → standardized error JSON; /api/health public for healthchecks   │
│  • JwtAuthenticationFilter, SecurityConfig, CORS                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  BUSINESS LAYER (Services)                                                                │
│  • AuthService, EnrollmentService, GradebookService, AssignmentService,                   │
│    QuizService, ModuleService, InboxService, FileStorageService (S3), etc.               │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  DATA LAYER                                                                               │
│  • Spring Data MongoDB (repositories)                                                     │
│  • AWS S3 (file storage via S3FileStorageService)                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow & Data Flow

**1. User opens the app (e.g. `http://<EC2-IP>/`)**

- Browser requests `/` → Nginx (frontend container) serves `index.html` and assets from `dist/`.
- SPA loads; if no token, redirects to `/signin`.

**2. User signs in**

- `POST /api/auth/signin` (credentials) → Nginx proxies to backend → AuthController → AuthService → JWT issued; access token in response body; refresh token can be set in cookie.
- Frontend stores access token (e.g. localStorage), calls `GET /api/auth/me` → AuthContext sets user, redirects to `/dashboard`.

**3. User opens a course (e.g. `/courses/:courseId/assignments`)**

- Frontend requests course details and assignments; all requests go to `/api/...` → Nginx → backend.
- Backend validates JWT, loads user, checks enrollment/permissions in services, returns JSON.

**4. User uploads a file for an assignment**

- Frontend encodes file as base64, calls `POST /api/files/upload` with `{ fileName, base64Data }`.
- Backend decodes, validates size, uploads to S3 via FileStorageService, returns `{ url, fileName, fileSize }`.
- Frontend submits assignment with that URL.

**5. Instructor opens gradebook**

- Frontend calls gradebook view API → backend bulk-loads students, assignments, quizzes, submissions, quiz attempts, cached gradebooks; builds grid in memory with O(1) lookups; returns JSON → frontend renders table.

---

## Backend Architecture

### Technology & Structure

- **Framework:** Spring Boot 3.2, Java 21.
- **Security:** Spring Security; JWT in `Authorization: Bearer <token>`; BCrypt passwords; stateless sessions; optional `@RequireRole` and RoleSecurityAspect.
- **Persistence:** Spring Data MongoDB; collections: users, courses, enrollments, assignments, submissions, gradebooks, quizzes, quiz_attempts, questions, modules, module_items, discussions, posts, notifications, calendar_events, etc.
- **API:** REST, JSON; context path `/api`; standardized errors via `GlobalExceptionHandler`: `{ timestamp, path, code, message, details[] }`.
- **Docs:** SpringDoc OpenAPI; Swagger UI at `/api/swagger-ui/index.html`.

### Package Layout (Domain-Driven)

| Package       | Responsibility |
|---------------|-----------------|
| `auth`       | Signup, signin, signout, refresh, `/auth/me`; JWT issue/validate. |
| `users`      | User CRUD, roles. |
| `courses`    | Course CRUD, course people. |
| `enrollments`| Enrollment lifecycle, course role, permission checks. |
| `assignments`| Assignments, submissions, grading; file upload (base64 → S3). |
| `grades`     | Gradebook; batch-loaded view; override scores. |
| `quizzes`    | Quiz CRUD, questions, attempts, auto-grading. |
| `modules`    | Course modules and items. |
| `discussions`| Discussion topics and threaded posts. |
| `inbox`      | Internal messaging. |
| `notifications` | User notifications. |
| `calendar`   | Calendar events. |
| `common`     | HealthController (`GET /health`), RootController (API info), security annotations, DTOs, error handling. |
| `config`     | Security, CORS, MongoDB. |

### Notable Design Choices

- **Gradebook:** Bulk-fetch submissions and quiz attempts; index by (studentId, assignmentId) and (studentId, quizId) for O(1) lookups when building the grid; avoid N+1 queries.
- **File uploads:** Client sends base64; backend decodes and uploads via `FileStorageService`; production impl is `S3FileStorageService` (bucket/region from env).
- **Intelligent Notifications:** Dual-feed system where the top-bar bell handles high-priority alerts (Messages, Grades, Quizzes) while the dashboard activity feed focuses on academic updates (Content, Discussions). Notifications are "course-aware," attaching `courseId` for contextual UI rendering.
- **Errors:** All exceptions normalized to one JSON shape for consistent frontend handling.

---

## Frontend Architecture

### Technology & Structure

- **Stack:** React 18, TypeScript, Vite, React Router 6, TanStack Query, React Hook Form, Zod.
- **UI:** Tailwind, shadcn/ui (Radix), Lucide; theming (e.g. dark) via next-themes.
- **State:** AuthContext (user, login/logout); QuizContext; server state with TanStack Query.

### Routing & Layouts

- **Auth:** `/signin`, `/signup` (no auth).
- **Main:** Sidebar + topbar; dashboard, courses, calendar, inbox, account, labs.
- **Course:** `/courses/:courseId/...` — home, modules, assignments (list/create/detail/edit), quizzes (list/create/detail/attempt/edit/preview), grades, gradebook, discussions, people, zoom.
- **ProtectedRoute:** Wraps authenticated routes; redirects to `/signin` when not logged in.

### API Integration

- **Base:** `lib/api.ts` — `apiFetch()` with Bearer token, `credentials: 'include'`, error parsing (`parseError`, `getErrorMessage`, `extractFieldErrors`).
- **Domain APIs:** `auth-api`, `courses-api`, `assignments-api`, `modules-api`, `quizzes-api`, `grades-api`, `discussions-api`, `inbox-api`, `notifications-api`, `calendar-api`, `users-api`.

---

## Security & Network

- **EC2 Security Group:** Inbound: 80 (HTTP), 22 (SSH); optionally 4000 if you expose API directly (typical setup uses only 80 and Nginx proxy).
- **Secrets:** Not in repo. `backend/.env` on EC2 holds `MONGODB_URI`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `SPRING_PROFILES_ACTIVE=prod`. GitHub Actions uses `EC2_HOST`, `EC2_USER`, `EC2_KEY` for SSH only.
- **CORS:** Backend allows origins from `CORS_ALLOWED_ORIGINS` (e.g. EC2 URL or domain); credentials allowed for cookie-based refresh.
- **Auth:** JWT access token; refresh via cookie or body; BCrypt; course-level and role checks in backend services.

---

## External Dependencies

| Service         | Role |
|-----------------|------|
| **MongoDB Atlas** | Primary database; connection string in `backend/.env` (`MONGODB_URI`, `MONGODB_DATABASE`). |
| **AWS S3**        | File storage for assignment uploads; bucket and credentials in `backend/.env`. |
| **GitHub**        | Source code, GitHub Actions, GHCR for Docker images. |
| **EC2**           | Single host for Docker Compose; public IP or domain for user access. |

---

## Summary Tables

### Deployment Summary

| Item | Detail |
|------|--------|
| **Host** | Amazon EC2 (e.g. Ubuntu 24.04 LTS ARM64, t4g.small). |
| **Orchestration** | Docker Compose (two services on bridge network `courseflow-network`). |
| **Frontend container** | Nginx Alpine; port 80; serves SPA; proxies `/api/` to backend; `depends_on` backend when healthy; healthcheck on `/`. |
| **Backend container** | Eclipse Temurin 21 JRE; port 4000; Spring Boot context `/api`; healthcheck `GET /api/health`. |
| **Image registry** | GitHub Container Registry (ghcr.io). |
| **CI/CD** | GitHub Actions on push to `main`: build → push to GHCR → SSH to EC2 → pull, tag, `up -d --remove-orphans` → health-check loop → rollback to `:stable` if unhealthy. |

### Tech Stack Summary

| Layer   | Technologies |
|---------|---------------|
| **Client** | React 18, TypeScript, Vite, TanStack Query, shadcn/ui, Tailwind, JWT in memory. |
| **API**    | Spring Boot 3.2, Java 21, REST, JSON, JWT, Spring Security, Spring Data MongoDB. |
| **Data**   | MongoDB (Atlas), AWS S3 (files). |
| **Deploy** | Docker, Docker Compose, Nginx, GitHub Actions, GHCR, AWS EC2. |

---

This architecture supports a single-instance deployment on **Amazon EC2** with **GitHub Actions** automating build, push to **GHCR**, and deploy via SSH and **Docker Compose**, while keeping secrets on the server and using **MongoDB Atlas** and **AWS S3** as managed external services.
