import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";

/**
 * Middleware to require email verification for protected routes
 * Redirects unverified users to verification page
 */
export const requireVerifiedEmail = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  if (!req.user?.isVerified) {
    return res.status(403).json({ 
      error: "Email verification required",
      requiresVerification: true,
      message: "Please verify your email to access this feature"
    });
  }
  return next();
};

/**
 * Middleware to check if user is verified (for frontend routes)
 * Returns user verification status without blocking
 */
export const checkVerificationStatus = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  // Always pass through, but attach verification status to response
  res.locals.isVerified = req.user?.isVerified || false;
  return next();
};