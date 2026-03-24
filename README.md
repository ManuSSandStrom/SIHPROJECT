# SIHPROJECT

SIHPROJECT is a local-first smart classroom platform built with React, Node.js, Express, and MongoDB.

It includes:

- timetable scheduling
- attendance management by department and section
- holiday attendance support
- student complaints and issue resolution
- lecturer feedback from student login
- admin portal for students, lecturers, attendance, holidays, and monitoring

## Local Run

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Default Admin Login

- Email: `admin@blueboard.edu`
- Password: `Admin@123`

## Local Environment

Frontend uses:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Backend uses:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
```
