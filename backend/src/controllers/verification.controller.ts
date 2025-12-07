import { Request, Response } from "express";
import { sendVerificationEmailService, verifyEmailWithToken } from "../services/verification.service";

export const sendVerificationEmailController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await sendVerificationEmailService(email);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({ message: result.message });
  } catch (error: any) {
    console.error("Error in send verification email controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmailController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const result = await verifyEmailWithToken(token);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({
      message: result.message,
      user: result.user
    });
  } catch (error: any) {
    console.error("Error in verify email controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};