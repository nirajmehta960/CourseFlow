# CourseFlow Backend

Spring Boot 3 backend for CourseFlow Learning Management System.

## Prerequisites

- Java 17 or 21
- Maven 3.9+
- MongoDB Atlas connection string (or local MongoDB)

## Quick Start

### Option 1: Direct Maven Command (Recommended)

The application automatically loads environment variables from `.env` file (just like Node.js).

```bash
cd backend

# Create .env file with your MongoDB connection
echo "MONGODB_URI=your-mongodb-connection-string" > .env
echo "SERVER_PORT=4000" >> .env

# Run the application (automatically loads .env)
mvn spring-boot:run
```

**No need to export variables manually!** The `.env` file is automatically loaded when Spring Boot starts.

### Option 2: Using start.sh (Convenience Script)

The `start.sh` script handles:
- Port checking and cleanup (ports 4000 and 5000)
- Java version setup (Java 21)
- Compilation before running

```bash
cd backend
./start.sh
```

**Note:** The `.env` file is still automatically loaded by Spring Boot, so the script doesn't need to handle it.

## Environment Variables

Environment variables are automatically loaded from `.env` file in the `backend/` directory.

**Required:**
- `MONGODB_URI`: MongoDB connection string

**Optional:**
- `SERVER_PORT`: Server port (default: 4000)
- `JWT_SECRET`: JWT secret key (default: development key)
- `CORS_ALLOWED_ORIGINS`: Allowed frontend origins

**Example `.env` file:**
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/CourseFlow
SERVER_PORT=4000
JWT_SECRET=your-secret-key-here
```

You can also set environment variables manually if you prefer:
```bash
export MONGODB_URI="your-connection-string"
mvn spring-boot:run
```


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
