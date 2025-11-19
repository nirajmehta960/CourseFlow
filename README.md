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

## 📝 License

MIT
