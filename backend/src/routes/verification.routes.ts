import { Router } from "express";
import { sendVerificationEmailController, verifyEmailController } from "../controllers/verification.controller";

const router = Router();

// Send verification email
router.post("/send-verification-email", sendVerificationEmailController);

// Verify email with token (for frontend trigger page)
router.get("/verify-email", verifyEmailController);

export default router;