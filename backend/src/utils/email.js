import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    return {
      delivered: false,
      reason: "SMTP is not configured.",
    };
  }

  await activeTransporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    html,
    text,
  });

  return { delivered: true };
}

export function queueEmail(message) {
  Promise.resolve()
    .then(() => sendEmail(message))
    .catch((error) => {
      console.error("[email:queue]", error);
    });

  return { queued: true };
}
