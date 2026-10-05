# SyncUp

SyncUp is a productivity application designed to help users organize and manage their activities. The application uses a React frontend, a Spring Boot backend, and a MySQL database hosted on Amazon RDS.

## Technology Stack

- Frontend: React with Vite
- Backend: Java with Spring Boot
- Database: MySQL hosted on Amazon RDS
- Build Tool: Maven
- Password Security: BCrypt
- Version Control: Git and GitHub

## Prerequisites

Before running SyncUp, make sure the following are installed:

- Java 21
- Maven
- Node.js
- npm

Access to the SyncUp Amazon RDS database is also required for database functionality.

## Running the Application

### 1. Configure the Database Password

The backend retrieves the database password from the `SYNCUP_DB_PASSWORD` environment variable.

In PowerShell, set the variable before starting the backend:

```powershell
$env:SYNCUP_DB_PASSWORD="<database-password>"
```

The actual database password is not stored in the GitHub repository.

### 2. Build and Start the Backend

From the root SyncUp directory:

```powershell
cd syncup_backend
mvn clean package
mvn spring-boot:run
```

The Spring Boot backend runs on:

`http://localhost:8080`

### 3. Install and Start the Frontend

Open a second terminal and, from the root SyncUp directory, run:

```powershell
cd syncup
npm install
npm run dev
```

The React application will normally be available at:

`http://localhost:5173`

Open this address in a web browser to use the application.

## User Management

The current SyncUp user management system supports:

- User registration
- BCrypt password hashing
- User login
- Basic session creation and tracking
- User logout
- Session logout tracking
- Integration with the Amazon RDS MySQL database
- Integration between the React frontend and Spring Boot backend

The current verification/2FA screen is a prototype for demonstration purposes and accepts any six-digit verification code.

## Database

The database schema is provided in the project's SQL script and can be used to recreate the required database tables.

The application currently connects to a MySQL database hosted using Amazon RDS.