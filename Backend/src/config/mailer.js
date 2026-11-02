import nodemailer from "nodemailer";

const getTransporter = () => {
  const hasMailConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!hasMailConfig) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

export const sendPasswordResetEmail = async ({ email, name, otp }) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Password reset email is not configured");
  }

  const safeName = escapeHtml(name);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your CraftMIgo password reset code",
    text: `Hi ${name},\n\nYour CraftMIgo password reset code is ${otp}.\n\nThis code expires in 15 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Hi ${safeName},</p><p>Your CraftMIgo password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${otp}</p><p>This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
  });
};

export const sendEmailVerificationCode = async ({ email, name, otp }) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Email verification is not configured");
  }

  const safeName = escapeHtml(name);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your CraftMIgo email",
    text: `Hi ${name},\n\nYour CraftMIgo email verification code is ${otp}.\n\nThis code expires in 15 minutes. If you did not create this account, you can ignore this email.`,
    html: `<p>Hi ${safeName},</p><p>Your CraftMIgo email verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${otp}</p><p>This code expires in 15 minutes. If you did not create this account, you can ignore this email.</p>`,
  });
};