# Smart Classroom Management System

Smart Classroom Management System is a production-minded MERN campus operations platform built for colleges and academic institutions. It combines timetable scheduling, attendance, issue tracking, lecturer feedback, role-based dashboards, and public-facing support pages into one unified application.

The platform is designed around three secure roles:

- `admin`
- `faculty`
- `student`

It includes a hidden admin entry flow, faculty approval workflow, weekly timetable generation, timetable-driven attendance, OTP-enabled password recovery, academic master data management, issue resolution, and structured lecturer feedback analytics.

## What This Project Includes

### Core modules

- AI-style weekly timetable scheduler for Monday to Saturday with optional Sunday
- attendance management with faculty marking, student visibility, and admin oversight
- secure student issue and complaint management
- lecturer feedback templates, cycles, submissions, and analytics
- admin master-data workspace for academic structure management
- public home, features, and contact/help experience

### Security and authentication

- JWT access token + refresh token authentication
- cookie-based refresh flow
- bcrypt password hashing
- role-based authorization
- login rate limiting
- helmet, cors, and input validation
- faculty approval before faculty login access
- OTP + link-based password recovery flow

### Frontend stack

- React 19 + Vite
- React Router
- Tailwind CSS
- Framer Motion
- Axios
- React Hook Form
- Zod
- Zustand
- Recharts
- TanStack Table
- Date-fns
- Lucide icons

### Backend stack

- Node.js
- Express
- MongoDB + Mongoose
- Zod validation
- Nodemailer
- PDFKit
- Morgan

## Monorepo Structure

```text
SMART-CLASS-ROOM-MAJOUR-main/
|-- backend/
|   |-- .env.example
|   |-- package.json
|   |-- server.js
|   `-- src/
|       |-- app.js
|       |-- server.js
|       |-- config/
|       |-- constants/
|       |-- controllers/
|       |-- middlewares/
|       |-- models/
|       |-- routes/
|       |-- services/
|       |-- utils/
|       |-- validators/
|       `-- seeds/
|-- frontend/
|   |-- .env.example
|   |-- package.json
|   `-- src/
|       |-- api/
|       |-- components/
|       |-- constants/
|       |-- hooks/
|       |-- pages/
|       |-- routes/
|       |-- store/
|       `-- utils/
|-- render.yaml
|-- netlify.toml
`-- README.md
```

## Product Flows

### Admin

- logs in through hidden admin route
- manages departments, programs, sections, subjects, rooms, labs, assignments, and academic records
- approves or rejects faculty registrations
- generates and publishes weekly timetables
- reviews attendance, issues, contact messages, and feedback analytics

### Faculty

- registers and remains pending until admin approval
- logs in after approval
- views timetable
- marks attendance
- reviews assigned academic data and notifications
- views faculty-facing feedback submissions

### Student

- registers with college mapping
- logs in to personal dashboard
- views timetable and attendance
- raises issues securely
- submits lecturer feedback once per cycle
- receives notifications and shortage indicators

## Key Features

### 1. Weekly timetable scheduler

- one-week schedule generation
- Monday to Saturday by default
- optional Sunday support
- faculty/section/room/lab conflict handling
- draft and publish workflow
- timetable preview grid

### 2. Attendance management

- session-based attendance records
- timetable-driven faculty workflows
- student attendance visibility
- admin monitoring and exports
- shortage-oriented reporting model

### 3. Issue management

- private issue creation for students
- admin queue and issue detail handling
- status progression
- issue replies and visibility control

### 4. Lecturer feedback

- feedback template creation
- feedback cycles
- one submission per student per target/cycle
- aggregated reporting and analytics

### 5. Fast authentication and recovery

- optimized login and registration flow
- faster post-login dashboard handoff
- OTP-based forgot-password flow
- secure reset-link fallback
- background email queue behavior so recovery requests return quickly

## Backend API Overview

Base URL:

```text
http://localhost:5000/api
```

### Route groups

- `/auth`
- `/admin`
- `/students`
- `/faculty`
- `/departments`
- `/subjects`
- `/sections`
- `/timetable`
- `/attendance`
- `/issues`
- `/feedback`
- `/contact`
- `/dashboard`
- `/reports`
- `/notifications`

### Important auth routes

- `POST /api/auth/student/register`
- `POST /api/auth/faculty/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/academic-options`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/reset-password/otp`

### Health route

- `GET /api/health`

## Database and Seed Behavior

The backend automatically seeds baseline development data every time the server starts, but only creates the sample dataset when the reference department does not already exist.

### Seeded data includes

- default admin from environment variables
- one sample department
- one sample program
- one sample semester
- one sample section
- sample subjects
- sample classrooms and lab
- sample faculty and assignments
- sample students
- sample feedback template and active cycle
- sample holiday

### Seed entrypoint

The current seed command runs the backend startup path:

```bash
cd backend
npm run seed
```

Because startup already calls the seed logic, running `npm run dev` or `npm start` also seeds the database automatically.

## Environment Variables

### Backend

See [backend/.env.example](backend/.env.example).

Required or commonly used variables:

- `MONGO_URI`
- `OPENAI_API_KEY`
- `PORT`
- `FRONTEND_URL`
- `BCRYPT_SALT_ROUNDS`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `FIELD_ENCRYPTION_KEY`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

### Frontend

See [frontend/.env.example](frontend/.env.example).

- `VITE_API_BASE_URL`

## Local Development Setup

## 1. Clone the repository

```bash
git clone https://github.com/ManuSSandStrom/SIHPROJECT.git
cd SIHPROJECT
```

## 2. Configure backend

```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example` and fill in your real values.

Important local values:

- `MONGO_URI` should point to your MongoDB cluster or local MongoDB instance
- `FRONTEND_URL=http://localhost:5173`
- `PORT=5000`
- `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` should be valid local admin credentials

## 3. Configure frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## 4. Run backend

```bash
cd backend
npm run dev
```

The backend will:

- connect to MongoDB
- seed development data if needed
- start on the configured port

## 5. Run frontend

```bash
cd frontend
npm run dev
```

Frontend default local URL:

```text
http://localhost:5173
```

## Validation and Build Commands

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Backend

Run the backend locally:

```bash
cd backend
npm start
```

Or quickly verify module loading:

```bash
cd backend
node --input-type=module -e "import('./src/app.js').then(() => console.log('backend-ok'))"
```

## Role Entry Points

### Public routes

- `/`
- `/features`
- `/contact`

### Student routes

- `/student/login`
- `/student/register`
- `/student/dashboard`
- `/student/timetable`
- `/student/attendance`
- `/student/issues`
- `/student/feedback`
- `/student/notifications`

### Faculty routes

- `/faculty/login`
- `/faculty/register`
- `/faculty/dashboard`
- `/faculty/timetable`
- `/faculty/attendance`
- `/faculty/feedback`
- `/faculty/notifications`

### Admin routes

- `/admin/login`
- `/admin/dashboard`
- `/admin/operations`
- `/admin/timetable`
- `/admin/attendance`
- `/admin/issues`
- `/admin/feedback`
- `/admin/notifications`

### Password recovery

- `/recover-account`
- `/reset-password?token=...`

## Password Recovery Flow

### OTP flow

1. User opens `/recover-account`
2. User submits their email
3. Backend creates a recovery request and returns immediately
4. OTP email is sent in the background
5. User enters OTP + new password
6. Password is updated through `POST /api/auth/reset-password/otp`

### Link flow

1. User opens the reset link from email
2. Frontend reads the `token` query parameter
3. User sets a new password
4. Password is updated through `POST /api/auth/reset-password`

## Deployment

## Backend on Render

The repository already includes [render.yaml](render.yaml).

### Render service settings

- root directory: `backend`
- build command: `npm install`
- start command: `npm start`
- health check path: `/api/health`

### Required Render environment variables

- `PORT`
- `FRONTEND_URL`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

Optional but recommended:

- `BCRYPT_SALT_ROUNDS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `OPENAI_API_KEY`
- `FIELD_ENCRYPTION_KEY`

## Frontend on Netlify

The repository already includes [netlify.toml](netlify.toml).

### Netlify settings

- base directory: `frontend`
- build command: `npm run build`
- publish directory: `dist`

### Required Netlify environment variable

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

## Production Notes

- rotate all secrets before real deployment
- never commit real `.env` files
- set a strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- use a production SMTP account for password recovery
- do not use seeded demo passwords outside local development
- keep `FRONTEND_URL` aligned with your deployed frontend domain
- faculty accounts remain unusable until admin approval

## Current Implementation Notes

- the backend currently seeds sample data on startup rather than through a separate CLI-only seeding script
- frontend builds cleanly, but Vite still reports a large bundle warning during production build
- the admin entry remains intentionally hidden from the public navbar
- read-only academic lookup for registration is exposed via `/api/auth/academic-options`

## Suggested First Local Run

1. Configure backend `.env`
2. Configure frontend `.env`
3. Start backend with `npm run dev`
4. Start frontend with `npm run dev`
5. Visit `/contact` to access hidden admin and faculty entry points
6. Log in as admin using your `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD`
7. Review seeded academic data
8. Test student registration, faculty registration, login, forgot password, timetable, attendance, issue desk, and feedback flows

## Troubleshooting

### Backend starts but frontend cannot connect

- verify `VITE_API_BASE_URL`
- verify backend is running on the correct port
- verify CORS `FRONTEND_URL`

### Login works but dashboard is blank

- verify MongoDB data exists
- verify access token and refresh flow are configured correctly
- verify the seeded role data exists

### Forgot password email does not arrive

- verify SMTP variables
- check spam folder
- use the link or OTP flow only after backend SMTP is configured correctly

### Render deploy fails

- confirm all required environment variables are present
- check the Render log for Mongo or SMTP configuration issues
- make sure `MONGO_URI` is reachable from Render

## License / Usage

This repository is currently documented as an academic and portfolio-style full-stack project. If you plan to use it in a real institutional environment, do a full security, data privacy, and operational review before production rollout.
