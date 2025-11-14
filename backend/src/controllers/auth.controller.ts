import { Request, Response, NextFunction } from "express";
import { LoginDTO, CreateUserDTO, AuthRequest } from "../types";
import { verifyTurnstile } from "../utils/verifyTurnstile";
import { createUser, login as loginService, verifyEmail as verifyEmailService } from "../services/auth.service";

export const registerManager = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userData: CreateUserDTO = {
      ...req.body,
      role: "manager",
      managerId: null,
    };

    const user = await createUser(userData);
    const { passwordHash, ...userWithoutPassword } = user;

    return res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not Authenticated" });
    }
    const { passwordHash, ...userWithoutPassword } = req.user;

    return res.json({
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error("Current User Error", error);
    return res.status(500).json({ error: "Failed to get user data" });
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, turnstileToken } = req.body;

    // ✅ Verify Turnstile
    if (!turnstileToken) {
      return res.status(400).json({ error: "Captcha verification required" });
    }

    const isTurnstileValid = await verifyTurnstile(turnstileToken);

    if (!isTurnstileValid) {
      return res.status(400).json({ error: "Captcha verification failed. Please try again." });
    }

    // Continue with login
    const { user, token } = await loginService({ email, password });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(401).json({
      error: error.message,
    });
  }
};
export const createStaff = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user || req.user.role !== "manager") {
      return res.status(403).json({ error: "Manager access required" });
    }

    const userData: CreateUserDTO = {
      ...req.body,
      role: "staff",
      managerId: req.user.id,
    };

    const user = await createUser(userData);
    const { passwordHash, ...userWithoutPassword } = user;

    return res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    await verifyEmailService(userId);

    return res.json({ message: "Email verified successfully" });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const logout = (_req: Request, res: Response): Response => {
  res.clearCookie("token");
  return res.json({ message: "Logged out successfully" });
};
