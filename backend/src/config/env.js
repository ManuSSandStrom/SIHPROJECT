import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  jwtSecret: process.env.JWT_SECRET || "change-me-access-secret",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "change-me-refresh-secret",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  emailFrom: process.env.EMAIL_FROM || "noreply@smartclassroom.local",
  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY || "",
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || "admin@college.edu",
  defaultAdminPassword:
    process.env.DEFAULT_ADMIN_PASSWORD || "ChangeThisAdminPassword123!",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
};

export const isProduction = env.nodeEnv === "production";
