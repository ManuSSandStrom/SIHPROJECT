# SIHPROJECT

SIHPROJECT is a MERN smart classroom platform with:

- blue-and-white student/admin portal
- timetable scheduler
- attendance by department and section
- holiday attendance handling
- complaint and issue management
- lecturer feedback system
- admin-led lecturer and student management

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

## Deployment Ready

This repo is prepared for:

- Render for backend
- Netlify for frontend

Files added for deployment:

- [render.yaml](/c:/Users/Nandeesh%20kumar/OneDrive/Documents/SMART-CLASS-ROOM-MAJOUR-main/render.yaml)
- [netlify.toml](/c:/Users/Nandeesh%20kumar/OneDrive/Documents/SMART-CLASS-ROOM-MAJOUR-main/netlify.toml)
- [backend/.env.example](/c:/Users/Nandeesh%20kumar/OneDrive/Documents/SMART-CLASS-ROOM-MAJOUR-main/backend/.env.example)
- [frontend/.env.example](/c:/Users/Nandeesh%20kumar/OneDrive/Documents/SMART-CLASS-ROOM-MAJOUR-main/frontend/.env.example)

## Render Setup

Use these values in Render:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Environment variables for Render:

```env
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openrouter_or_openai_key
PORT=10000
FRONTEND_URL=https://your-netlify-site.netlify.app
DEFAULT_ADMIN_EMAIL=admin@blueboard.edu
DEFAULT_ADMIN_PASSWORD=Admin@123
```

## Netlify Setup

Use these values in Netlify:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

Environment variables for Netlify:

```env
VITE_API_BASE_URL=https://sihproject-19te.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Manual Commands

If you want to use the platform UIs instead of the config files:

Render:

```bash
npm install
npm start
```

Netlify:

```bash
npm run build
```

## Notes

- Backend CORS is prepared for localhost, Netlify, and Render origins.
- Keep real secrets in Render and Netlify environment settings, not in git.
- If you use a production Clerk project, replace the development key in Netlify.
