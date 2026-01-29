# CourseFlow

**A modern Learning Management System built for the digital age**

CourseFlow is a full-featured LMS that brings together students, instructors, and administrators in a seamless, intuitive platform. Built with cutting-edge technologies and a focus on user experience.

![CourseFlow](https://img.shields.io/badge/CourseFlow-LMS-blue) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen) ![React](https://img.shields.io/badge/React-18.3-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)

---

## Features

### Core Functionality
- **Course Management** - Create, organize, and manage courses with rich content
- **Gradebook** - High-performance grading system using batch processing and in-memory O(1) lookups.
- **Assignments & Submissions** - Streamlined workflow with AWS S3 cloud storage integration.
- **Course Modules** - Organize content into structured modules with drag-and-drop
- **Discussions** - Threaded discussions for course collaboration
- **Inbox** - Built-in messaging system for course communication
- **Calendar** - Integrated calendar for assignments, quizzes, and events
- **Notifications** - Real-time notifications for important updates
- **Automated CI/CD** - Continuous Integration and Deployment via GitHub Actions

### Security & Access
- JWT-based authentication with refresh tokens
- Role-based access control (Student, Instructor, Admin)
- Course-level permissions and enrollment management
- Secure file uploads and downloads

### User Experience
- Responsive design for all screen sizes
- Dark mode support
- Modern UI with shadcn/ui components
- Intuitive navigation and layouts
- Real-time updates and notifications

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **TanStack Query** for data fetching
- **React Hook Form** + **Zod** for form validation

### Backend
- **Spring Boot 3.2** with Java 21
- **MongoDB** for data persistence
- **Spring Security** with JWT authentication
- **Spring Data MongoDB** for data access
- **OpenAPI/Swagger** for API documentation
- **Lombok** for cleaner code

### Infrastructure
- MongoDB Atlas ready
- AWS S3 Integration for file storage
- GitHub Actions CI/CD pipeline (GHCR + EC2)
- Docker & Docker Compose support

---

## Quick Start

### Prerequisites

- **Docker & Docker Compose** (Recommended)
- **Java 21+** (for manual backend run)
- **Node.js 18+** (for manual frontend run)
- **MongoDB Atlas Connection String**

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/nirajmehta960/CourseFlow.git
   cd CourseFlow
   ```

2. **Configure Environment**
   Ensure your `backend/.env` file contains your MongoDB Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://...
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the Application**
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
   - **Swagger UI**: [http://localhost:4000/api/swagger-ui/index.html](http://localhost:4000/api/swagger-ui/index.html)

### Option 2: Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nirajmehta960/CourseFlow.git
   cd CourseFlow
   ```

2. **Backend Setup**
   ```bash
   cd backend
   
   # Create .env file from example
   cp .env.example .env
   # Edit .env with your MongoDB URI
   
   # Run the application
   mvn spring-boot:run
   ```
   Backend runs on `http://localhost:4000`

3. **Frontend Setup**
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Create .env file
   cp .env.example .env
   # VITE_API_BASE_URL should point to your backend
   
   # Start development server
   npm run dev
   ```
   Frontend runs on `http://localhost:5173` (Manual Mode) or `http://localhost:3000` (Docker Mode)

### Quick Reference: Environment Variables

**Backend** (`backend/.env`):
```env
# Database
MONGODB_URI=mongodb://localhost:27017/CourseFlow

# AWS S3 (Required for file uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=courseflow-uploads

# Security (Production Only)
JWT_SECRET=your_long_random_secret_string
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
SPRING_PROFILES_ACTIVE=dev
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## Project Structure

```
CourseFlow/
├── backend/                 # Spring Boot application
│   ├── src/main/java/
│   │   └── com/courseflow/
│   │       ├── assignments/ # Assignment management
│   │       ├── auth/        # Authentication & authorization
│   │       ├── courses/     # Course management
│   │       ├── quizzes/     # Quiz system
│   │       ├── grades/      # Gradebook
│   │       ├── discussions/ # Discussion forums
│   │       ├── inbox/       # Messaging
│   │       ├── modules/    # Course modules
│   │       └── ...
│
└── frontend/                # React application
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── pages/          # Page components
    │   ├── lib/            # API clients & utilities
    │   ├── contexts/       # React contexts
    │   └── hooks/          # Custom hooks
    └── public/             # Static assets
```

---

## API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:4000/api/swagger-ui/index.html`
- **OpenAPI JSON**: `http://localhost:4000/api/v3/api-docs`

---

## Development

### Backend
```bash
cd backend
mvn clean install          # Build
mvn spring-boot:run        # Run
mvn test                   # Run tests
```

### Frontend
```bash
cd frontend
npm install                # Install dependencies
npm run dev                # Development server
npm run build              # Production build
npm run lint               # Lint code
```

---

### Deployment & DevOps
Detailed guides for different deployment scenarios:

- **[CI/CD with GitHub Actions](CICD.md)** - **Recommended**. Automated deployment to AWS EC2.
- **[Manual AWS EC2 Deployment](DEPLOYMENT.md)** - Manual steps for setting up and running on AWS.
- **[AWS S3 Setup Guide](AWS_S3_SETUP.md)** - How to configure cloud storage for uploads.

### Other Hosting Options
- **Backend on Render**: Use `render.yaml` for one-click deployment
- **Frontend on Vercel**: Connect GitHub repo for automatic deployments
- **Frontend on Netlify**: Configure build command: `npm run build`

---

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Keep components and functions focused

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Authors

**Niraj Mehta**
- GitHub: [@nirajmehta960](https://github.com/nirajmehta960)

---

## Acknowledgments

- Built with [Spring Boot](https://spring.io/projects/spring-boot) and [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

<div align="center">

**Made with passion for better education**

Star this repo if you find it helpful!

</div>
