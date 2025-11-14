import { Router } from "express";
import { login, createStaff, verifyEmail, logout, registerManager, getCurrentUser } from "../controllers/auth.controller";
import { authenticate, authorizeManager, validateLogin } from "../middlewares/auth.middleware";

const router = Router();

// Auth routes
router.post("/login", validateLogin, login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getCurrentUser);

// User creation routes
router.post("/create/manager", registerManager);
router.post("/create/staff", authenticate, authorizeManager, createStaff);

// Email verification
router.post("/verify/:userId", authenticate, verifyEmail);

export default router;
