import { Request, Response, NextFunction } from "express";

import { z } from "zod";
import jwt from "jsonwebtoken";

import { AuthRequest } from "../types";
import { prisma } from "../../db/prisma"; // ✅ Fix path

export interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const validateAdminSecret = (req: Request, res: Response, next: NextFunction): void | Response => {
  try {
    const secretKey = req.headers["x-admin-secret"] as string;

    if (!secretKey) {
      return res.status(401).json({ error: "Admin secret key required" });
    }

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ error: "Invalid admin secret key" });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ error: "Failed to validate admin secret" });
  }
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ error: "Email not verified" });
    }

    // Attach user to request object
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const authorizeManager = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  if (req.user?.role !== "manager") {
    return res.status(403).json({ error: "Manager access required" });
  }
  return next();
};

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const validateLogin = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    loginSchema.parse(req.body);

    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }
    return res.status(400).json({ error: "Invalid input data" });
  }
};
