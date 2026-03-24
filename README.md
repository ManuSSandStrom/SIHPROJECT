# SIHPROJECT

SIHPROJECT is a professional MERN smart campus platform for MCA and college operations. The application now uses a cleaner blue-and-white multi-page experience for students, lecturers, and admins across mobile, laptop, and larger screens.

## Core Modules

- professional home dashboard with no exposed backend links
- timetable scheduler with course, lecturer, and classroom setup
- AI-assisted timetable generation for Monday to Saturday
- optional Sunday special class support
- attendance management by department, semester, and section
- holiday creation with automatic full attendance handling
- complaint and issue management for students
- lecturer feedback and ratings from student accounts
- contact/help page that sends messages into the admin portal
- hidden admin access through the lock entry on the Contact / Help page

## User Flow

### Public Website

- `Home`: overview of campus workflows, latest timetable preview, and feature cards
- `Time Table Scheduler`: professional scheduler page with admin-only resource setup and AI generation
- `Attendance`: admin-only attendance taking page
- `Raise Complaint`: signed-in students can raise academic, attendance, timetable, facility, or technical issues
- `Lecturer Feedback`: signed-in students can rate lecturers and submit structured feedback
- `Contact / Help`: support form with phone, email, college ID, and message fields
- `Student Login`: student sign in and sign up with unique college ID enforcement

### Admin Access

- admin access is not shown in the top navigation
- the admin lock is available only from the `Contact / Help` page
- clicking the lock opens the admin sign-in page
- after admin login, the admin portal becomes accessible

## Admin Portal

The admin portal includes:

- student creation by department, semester, and section
- lecturer onboarding with subject mapping
- course setup for departments
- classroom and lab setup
- holiday setup with full attendance support
- complaint resolution queue
- lecturer feedback review tools
- contact/help inbox from the website
- attendance and academic operations summary

## Student Features

- sign up with unique college ID
- sign in to access complaint and feedback workflows
- submit complaints for admin review
- rate lecturers and send feedback
- contact the college/help desk through the portal

## Default Admin Login

- Email: `admin@blueboard.edu`
- Password: `Admin@123`

## Contact Information Shown In Website

- Phone: `9515022680`
- Email: `manoharbasappagari18@gmail.com`

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Files

### Backend `.env`

```env
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_or_openrouter_key
PORT=5000
FRONTEND_URL=http://localhost:5173
DEFAULT_ADMIN_EMAIL=admin@blueboard.edu
DEFAULT_ADMIN_PASSWORD=Admin@123
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Deployment

This repo is ready for:

- Render for backend
- Netlify for frontend

### Render

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Recommended Render environment variables:

```env
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_or_openrouter_key
PORT=10000
FRONTEND_URL=https://your-netlify-site.netlify.app
DEFAULT_ADMIN_EMAIL=admin@blueboard.edu
DEFAULT_ADMIN_PASSWORD=Admin@123
```

### Netlify

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

Recommended Netlify environment variables:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Config Files

- `render.yaml`
- `netlify.toml`
- `backend/.env.example`
- `frontend/.env.example`

## Notes

- CORS is configured for localhost, Netlify, and Render deployments.
- Do not commit real secrets into git.
- Replace development Clerk keys before production deployment.
