import crypto from "crypto";

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, passwordHash };
}

export function verifyPassword(password, passwordHash, salt) {
  const candidateHash = crypto.scryptSync(password, salt, 64);
  const storedHash = Buffer.from(passwordHash, "hex");

  if (candidateHash.length !== storedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateHash, storedHash);
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const plainUser = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete plainUser.passwordHash;
  delete plainUser.salt;
  return plainUser;
}
