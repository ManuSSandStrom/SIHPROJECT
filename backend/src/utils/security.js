import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env, isProduction } from "../config/env.js";
import { TOKEN_COOKIE } from "../constants/app.js";

const bcryptSaltRounds = Math.min(Math.max(Number(env.bcryptSaltRounds || 10), 8), 14);

export async function hashPassword(password) {
  return bcrypt.hash(password, bcryptSaltRounds);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function randomOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      status: user.status,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: "15m" },
  );
}

export function signRefreshToken(user, tokenId) {
  return jwt.sign(
    {
      sub: String(user._id),
      tokenId,
    },
    env.jwtRefreshSecret,
    { expiresIn: "7d" },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

export function setRefreshCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
}
