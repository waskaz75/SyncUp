# SyncUp

SyncUp is a hosted productivity application for organizing tasks, calendar events, and focused work in one place. The React/Vite frontend is hosted on Vercel, the Spring Boot REST backend runs on AWS Elastic Beanstalk, and application data is stored in Amazon RDS for MySQL.

**Website:** [syncup-project.com](https://www.syncup-project.com)

## Features

- Account registration and login
- Email-based two-factor verification
- Session creation and logout tracking
- Calendar event creation, editing, and deletion
- Checklists and checklist items
- Focus timer
- Customizable background images
- Chatbot panel in the productivity workspace

## Technology stack

- **Frontend:** React 19, Vite 8, JavaScript
- **Backend:** Java 21, Spring Boot 3.5
- **Database:** MySQL on Amazon RDS
- **Build tools:** npm and Maven
- **Password security:** BCrypt
- **Email:** SMTP for two-factor verification codes
- **Hosting:** Vercel, AWS Elastic Beanstalk, and Amazon RDS

## Repository structure

```text
SyncUp/
├── syncup/                         # React/Vite frontend
├── syncup_backend/                 # Spring Boot backend
│   └── src/main/resources/
│       └── database.sql            # Database schema
└── README.md
```

## Hosted architecture

| Component | Hosting |
| --- | --- |
| React/Vite frontend | Vercel |
| Spring Boot backend | AWS Elastic Beanstalk |
| MySQL database | Amazon RDS |
| Two-factor verification email | Configured SMTP provider |

## Configuration

### Backend environment variables

The backend reads the database password and SMTP settings from environment variables. Configure these values in the AWS Elastic Beanstalk environment:

| Variable | Required | Description |
| --- | --- | --- |
| `SYNCUP_DB_PASSWORD` | Yes | Password for the configured MySQL user |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | No | SMTP server port; defaults to `587` |
| `SMTP_USERNAME` | Yes | SMTP account username |
| `SYNCUP_MAIL_FROM` | No | Sender address; defaults to `SMTP_USERNAME` |
| `PORT` | No | Backend port; defaults to `8080` |

The database password and SMTP credentials must not be committed to the repository.

### Frontend environment variables

Configure the following environment variable in the Vercel project settings. Its value should be the public URL of the deployed AWS Elastic Beanstalk backend:

```text
VITE_API_BASE_URL=<elastic-beanstalk-backend-url>
```

Vite exposes variables prefixed with `VITE_` to the frontend. `VITE_API_BASE_URL` is not a secret, but database and SMTP credentials must never be added to Vercel or committed to the repository.

## Database setup

The backend connects to the configured Amazon RDS MySQL instance and uses the `syncupdb` schema. Initialize or update the RDS database using [`syncup_backend/src/main/resources/database.sql`](syncup_backend/src/main/resources/database.sql):

```sql
SOURCE syncup_backend/src/main/resources/database.sql;
```

The RDS security group must allow connections from the AWS Elastic Beanstalk environment. Keep database credentials in Elastic Beanstalk environment configuration rather than in source control.

## Deployment

### Frontend

The `syncup` project is deployed through Vercel. Configure the production `VITE_API_BASE_URL` environment variable to point to the AWS Elastic Beanstalk backend, then trigger a deployment from the connected repository.

### Backend

The `syncup_backend` project is packaged as a Spring Boot application and deployed to AWS Elastic Beanstalk. Elastic Beanstalk supplies the `PORT` value when configured; the application defaults to port `8080` when no value is provided.

The backend deployment must have the following configured:

- The `SYNCUP_DB_PASSWORD` database password
- The SMTP variables listed above
- Network access to the Amazon RDS instance
- CORS access for the deployed Vercel frontend origin

For CI or deployment validation, the available frontend checks are:

```powershell
cd syncup
npm install
npm run lint
npm run build
```

## API overview

The deployed frontend communicates with the Elastic Beanstalk backend through `VITE_API_BASE_URL`. The main endpoint groups are:

- `/api/auth` — registration, login, two-factor verification, and logout
- `/api/calendar` — calendar event operations
- `/api/checklist` — checklist and checklist item operations

The backend allows requests from the deployed SyncUp origins configured in its controllers. If the production frontend domain changes, update the backend CORS configuration before deploying.

## Notes

- Login requires a verification code delivered through the configured SMTP service.
- A successful verification creates a server-side session.
- The database connection uses credentials supplied through environment variables; never hard-code or commit them.
