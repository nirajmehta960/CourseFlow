# CourseFlow - Learning Management System

A full-stack Learning Management System (LMS) built with React (frontend) and Spring Boot (backend).

## 📁 Project Structure (Monorepo)

This is a monorepo containing both frontend and backend code in the same repository:

```
CourseFlow/
├── frontend/          # React + TypeScript + Vite frontend
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   ├── package.json   # Frontend dependencies
│   └── .env.example   # Frontend environment variables template
│
├── backend/           # Spring Boot + Java backend
│   ├── src/           # Java source code
│   ├── pom.xml        # Maven dependencies
│   └── .env.example   # Backend environment variables template
│
└── README.md          # This file
```

## 🚀 Quick Start

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev          # Development server (http://localhost:5173)
npm run build        # Production build
```

### Backend (Spring Boot)

```bash
cd backend
# Set up .env file from .env.example
mvn spring-boot:run  # Or use: ./start.sh
```

## 🌐 Server Configuration

### Backend Server

- **Default Port**: `4000`
- **Context Path**: `/api`
- **Base URL**: `http://localhost:4000/api`
- **API Documentation**: `http://localhost:4000/api/swagger-ui.html`
- **Health Check**: `http://localhost:4000/api/health` (if implemented)

### Changing the Server Port

You can change the server port in two ways:

1. **Environment Variable** (Recommended):

   ```bash
   export SERVER_PORT=8080
   mvn spring-boot:run
   ```

2. **Configuration File**:
   Edit `backend/src/main/resources/application.yml`:
   ```yaml
   server:
     port: 8080 # Change from 4000 to your desired port
   ```

### Frontend Development Server

- **Default Port**: `5173` (Vite default)
- **URL**: `http://localhost:5173`

## 🔧 Environment Variables

### Frontend

Copy `frontend/.env.example` to `frontend/.env` and set:

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:4000/api)

### Backend

Copy `backend/.env.example` to `backend/.env` and set:

- `MONGODB_URI` - MongoDB connection string (required for production)

All other variables have defaults in `backend/src/main/resources/application.yml`.

## 📦 Deployment

This monorepo structure supports deploying frontend and backend separately:

- **Frontend**: Deploy from `frontend/` directory (e.g., Vercel, Netlify)
- **Backend**: Deploy from `backend/` directory (e.g., AWS Elastic Beanstalk, Render)

Most platforms allow you to specify the root directory for deployment, making it easy to deploy both from the same repository.

## 🛠️ Technology Stack

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query

### Backend

- Spring Boot 3.2.0
- Java 17/21
- MongoDB
- Spring Security + JWT
- Maven

## 📝 Modules System

The modules system follows a Canvas-like structure with separate Module and ModuleItem entities:

### Backend Endpoints
- `GET /api/courses/:id/modules` - Get all modules with items
- `POST /api/courses/:id/modules` - Create module
- `PATCH /api/modules/:moduleId` - Update module
- `DELETE /api/modules/:moduleId` - Delete module
- `POST /api/modules/:moduleId/items` - Create module item
- `PATCH /api/module-items/:itemId` - Update module item
- `DELETE /api/module-items/:itemId` - Delete module item
- `POST /api/courses/:id/modules/reorder` - Reorder modules and items

### Frontend Features
- Canvas-like collapsible modules
- Drag-drop reordering (HTML5 drag-drop API)
- Publish/unpublish modules and items
- Lock/unlock dates for modules
- Item icons by type (PAGE, ASSIGNMENT, QUIZ, FILE, URL)

**Note:** For enhanced drag-drop experience, you can install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`:
```bash
cd frontend && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## 📝 License

MIT
