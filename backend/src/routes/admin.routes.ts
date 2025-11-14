import { Router } from "express";
import { registerManager, createStaffViaAdmin } from "../controllers/admin.controller";
import { getAllManagers } from "../services/auth.service";
import { validateAdminSecret } from "../middlewares/auth.middleware";

const router = Router();

router.use(validateAdminSecret);

// Create manager & staff
router.post("/managers", registerManager);
router.post("/staff", createStaffViaAdmin);

// ✅ Get all managers (untuk dropdown)
router.get("/managers", async (req, res) => {
  try {
    const managers = await getAllManagers();
    return res.json({ managers });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch managers" });
  }
});

// ❌ HAPUS getAllUsers - GAK PERLU!

export default router;
