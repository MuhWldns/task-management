import { Request, Response } from "express";
import { verifyTurnstile } from "../utils/verifyTurnstile";
import { requestPasswordReset, validatePasswordResetToken, resetPassword } from "../services/passwordReset.service";

export const forgotPasswordController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, turnstileToken } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Verify Turnstile
    if (!turnstileToken) {
      return res.status(400).json({ error: "Captcha verification required" });
    }

    const isTurnstileValid = await verifyTurnstile(turnstileToken);

    if (!isTurnstileValid) {
      return res.status(400).json({ error: "Captcha verification failed. Please try again." });
    }

    const result = await requestPasswordReset(email);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({ message: result.message });
  } catch (error: any) {
    console.error("Forgot password controller error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const validateResetTokenController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token } = req.body;

    const result = await validatePasswordResetToken(token);

    if (!result.valid) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({ message: result.message });
  } catch (error: any) {
    console.error("Validate reset token controller error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPasswordController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token, password } = req.body;

    const result = await resetPassword(token, password);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({ message: result.message });
  } catch (error: any) {
    console.error("Reset password controller error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};