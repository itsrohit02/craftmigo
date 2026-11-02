import { ipKeyGenerator } from "express-rate-limit";
import { createRateLimiter } from "./rateLimiter.js";

const rateLimitResponse = {
  success: false,
  message: "Too many requests. Please try again later.",
};

const emailKey = (req) =>
  `email:${typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "missing"}`;

export const loginLimiter = createRateLimiter(15 * 60 * 1000, 5, {
  skipSuccessfulRequests: true,
  message: { ...rateLimitResponse, message: "Too many login attempts. Try again later." },
});

export const registrationLimiter = createRateLimiter(60 * 60 * 1000, 5, {
  message: { ...rateLimitResponse, message: "Too many registrations. Try again later." },
});

export const emailVerificationRequestIpLimiter = createRateLimiter(60 * 60 * 1000, 3, {
  message: { ...rateLimitResponse, message: "Too many verification code requests. Try again later." },
});

export const emailVerificationRequestEmailLimiter = createRateLimiter(60 * 60 * 1000, 3, {
  keyGenerator: emailKey,
  message: { ...rateLimitResponse, message: "Too many verification code requests for this email. Try again later." },
});

export const emailVerificationAttemptLimiter = createRateLimiter(60 * 60 * 1000, 10, {
  message: { ...rateLimitResponse, message: "Too many email verification attempts. Try again later." },
});

export const emailVerificationAttemptEmailLimiter = createRateLimiter(60 * 60 * 1000, 10, {
  keyGenerator: emailKey,
  message: { ...rateLimitResponse, message: "Too many email verification attempts for this email. Try again later." },
});

export const forgotPasswordIpLimiter = createRateLimiter(60 * 60 * 1000, 3, {
  message: { ...rateLimitResponse, message: "Too many password reset requests. Try again later." },
});

export const forgotPasswordEmailLimiter = createRateLimiter(60 * 60 * 1000, 3, {
  keyGenerator: emailKey,
  message: { ...rateLimitResponse, message: "Too many password reset requests for this email. Try again later." },
});

export const passwordResetLimiter = createRateLimiter(60 * 60 * 1000, 5, {
  message: { ...rateLimitResponse, message: "Too many password reset attempts. Try again later." },
});

export const passwordResetEmailLimiter = createRateLimiter(60 * 60 * 1000, 5, {
  keyGenerator: emailKey,
  message: { ...rateLimitResponse, message: "Too many password reset attempts for this email. Try again later." },
});

export const refreshTokenLimiter = createRateLimiter(15 * 60 * 1000, 30, {
  message: { ...rateLimitResponse, message: "Too many token refresh requests. Try again later." },
});

export const messageLimiter = createRateLimiter(60 * 1000, 30, {
  keyGenerator: (req) => req.user?._id ? `user:${req.user._id}` : `ip:${ipKeyGenerator(req.ip)}`,
  message: { ...rateLimitResponse, message: "Too many messages. Please slow down." },
});
