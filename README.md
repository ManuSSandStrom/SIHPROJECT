# Smart Classroom Management System

Production-minded MERN campus platform for admin, faculty, and student operations. The app now includes:

- JWT auth with access and refresh tokens
- admin, faculty, and student role-based workspaces
- faculty approval workflow
- weekly timetable generation for Monday to Saturday with optional Sunday support
- timetable-driven attendance workflows
- secure student issue management
- lecturer feedback cycles, templates, and analytics
- admin master data hub for departments, programs, sections, subjects, rooms, labs, and assignments
- PDF and CSV report exports
- Render and Netlify deployment config

## Monorepo Structure

```text
backend/
  src/
    config/
    constants/
    controllers/
    middlewares/
    models/
    routes/
    services/
    utils/
    validators/
    seeds/
frontend/
  src/
    api/
    components/
    constants/
    pages/
    routes/
    store/
    utils/
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend environment variables are documented in [backend/.env.example](/c:/Users/Nandeesh%20kumar/OneDrive/Documents/SMART-CLASS-ROOM-MAJOUR-main/backend/.env.example).

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend environment variables are documented in [frontend/.env.example](/c:/Users/Nandeesh%20kumar/OneDrive/Documents/SMART-CLASS-ROOM-MAJOUR-main/frontend/.env.example).

## Seed Data

The backend seeds automatically on startup:

- default admin from `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD`
- sample department, program, semester, section
- sample subjects
- sample faculty and students
- sample feedback template and active cycle
- sample room, lab, holiday, and faculty assignments

If you want to trigger the backend startup path directly:

```bash
cd backend
npm run seed
```

## Core API Surface

- `/api/auth`
- `/api/admin`
- `/api/students`
- `/api/faculty`
- `/api/departments`
- `/api/subjects`
- `/api/sections`
- `/api/timetable`
- `/api/attendance`
- `/api/issues`
- `/api/feedback`
- `/api/contact`
- `/api/dashboard`
- `/api/reports`
- `/api/notifications`

## Deployment

### Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`

Required environment variables:

- `MONGO_URI`
- `FRONTEND_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- optional email, Cloudinary, and OpenAI keys from `.env.example`

### Netlify

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-render-service.onrender.com`

## Notes

- The admin entry is intentionally hidden from the public navigation and is exposed through the contact/help flow.
- Faculty registration stays pending until an admin approves it.
- Attendance and timetable functionality depend on real master data and faculty assignments being present.
- If this repo has previously committed live credentials, rotate them immediately before deployment.
