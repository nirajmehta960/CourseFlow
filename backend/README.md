# CourseFlow Backend

Spring Boot 3 backend for CourseFlow Learning Management System.

## Prerequisites

- Java 17 or 21
- Maven 3.9+
- MongoDB Atlas connection string (or local MongoDB)

## Quick Start

### Option 1: Direct Maven Command (Simplest)

```bash
cd backend

# Set environment variables
export MONGODB_URI="your-mongodb-connection-string"
export SERVER_PORT=4000

# Run the application
mvn spring-boot:run
```

### Option 2: Using start.sh (Convenience Script)

The `start.sh` script handles:
- Port checking and cleanup (ports 4000 and 5000)
- Java version setup (Java 21)
- Environment variable loading from `.env` file
- Compilation and running

```bash
cd backend
./start.sh
```

### Option 3: Using run.sh (Simpler Script)

Just sets Java and environment variables, then runs:

```bash
cd backend
./run.sh
```

## Why use start.sh?

The `start.sh` script is a convenience wrapper that:
1. **Port Management**: Automatically kills processes on ports 4000/5000 if they're in use
2. **Environment Setup**: Loads MongoDB connection from `.env` file
3. **Java Version**: Ensures Java 21 is used (useful when multiple Java versions are installed)
4. **Compilation**: Runs `mvn clean compile` before starting

**You can absolutely run Spring Boot directly** without the script:

```bash
cd backend
export MONGODB_URI="your-connection-string"
export SERVER_PORT=4000
mvn spring-boot:run
```

This is equivalent to Node.js `npm start` - it's just `mvn spring-boot:run` instead.

## Environment Variables

Required:
- `MONGODB_URI`: MongoDB connection string

Optional:
- `SERVER_PORT`: Server port (default: 5000, set to 4000 for local dev)
- `JWT_SECRET`: JWT secret key (default: development key)
- `CORS_ALLOWED_ORIGINS`: Allowed frontend origins

## Configuration

Configuration is in `src/main/resources/application.yml`:
- Server port: 5000 (default) or 4000 (local dev)
- API context path: `/api`
- MongoDB database: `CourseFlow`

## API Endpoints

- Base URL: `http://localhost:4000/api` (or port 5000)
- Swagger UI: `http://localhost:4000/api/swagger-ui.html`
- API Docs: `http://localhost:4000/api/v3/api-docs`

## Build

```bash
mvn clean package
```

## Run JAR

```bash
java -jar target/courseflow-backend-0.0.1-SNAPSHOT.jar
```
