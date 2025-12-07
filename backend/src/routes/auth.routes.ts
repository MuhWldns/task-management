import { Router } from "express";
import { login, verifyEmail, logout, registerManager, getCurrentUser } from "../controllers/auth.controller";
import { authenticate, validateLogin } from "../middlewares/auth.middleware";

const router = Router();

// Auth routes
router.post("/login", validateLogin, login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getCurrentUser); // Allow unverified users to get their data

// Manager registration (public endpoint) - NOTE: Currently using admin routes instead
// router.post("/create/manager", registerManager);

// Email verification
router.post("/verify/:userId", authenticate, verifyEmail);

export default router;
