import express from "express";
import dotenv from "dotenv";
import dbConnect from "./utils/dbConnect.js";
import cors from "cors";

import { coursesRouter, } from "./routes/coursesRoute.js";
import { facultyRouter, } from "./routes/facultyRoute.js";
import { roomsRouter, } from "./routes/roomsRoute.js";
import { timetablesRouter, } from "./routes/timetableRoute.js";
import { aiRouter, } from "./routes/aiRoute.js";
import { notificationsRouter, } from "./routes/notificationsRoute.js";
import { usersRouter } from "./routes/usersRoute.js";
import { attendanceRouter } from "./routes/attendanceRoute.js";
import { issuesRouter } from "./routes/issuesRoute.js";
import { feedbackRouter } from "./routes/feedbackRoute.js";
import { dashboardRouter } from "./routes/dashboardRoute.js";
import { holidaysRouter } from "./routes/holidaysRoute.js";
import { contactMessagesRouter } from "./routes/contactMessagesRoute.js";
import { seedDefaultAdmin } from "./utils/seedDefaultAdmin.js";

dotenv.config({ quiet: true });

const app = express();
const exactOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  process.env.NETLIFY_URL,
].filter(Boolean);

const allowedOriginPatterns = [
  /^http:\/\/localhost(?::\d+)?$/,
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.onrender\.com$/,
];

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (exactOrigins.includes(origin)) {
    return true;
  }

  return allowedOriginPatterns.some((pattern) => pattern.test(origin));
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ status: "Backend running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "smart-classroom-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/courses", coursesRouter);
app.use("/api/faculty", facultyRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/timetables", timetablesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/users", usersRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/holidays", holidaysRouter);
app.use("/api/contact-messages", contactMessagesRouter);

// Global Error Handler to catch 500 errors
app.use((err, req, res, next) => {
  console.error("Backend Error:", err.message, err.stack);
  res.status(500).json({ 
    message: "Internal Server Error",
    error: err.message
  });
});

const startServer = async () => {
  await dbConnect();
  await seedDefaultAdmin();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
