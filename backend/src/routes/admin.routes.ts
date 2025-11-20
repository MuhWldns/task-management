import { Router } from "express";
import { registerManager, createStaffViaAdmin, getAllUsers, updateUserRoleController, softDeleteUserController } from "../controllers/admin.controller";
import { getAllManagers } from "../services/auth.service";
import { validateAdminSecret } from "../middlewares/auth.middleware";

const router = Router();

router.use(validateAdminSecret);

// Create manager & staff
router.post("/managers", registerManager);
router.post("/staff", createStaffViaAdmin);

// Get users
router.get("/managers", async (req, res) => {
  try {
    const managers = await getAllManagers();
    return res.json({ managers });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch managers" });
  }
});

// Get all users with hierarchy
router.get("/users", getAllUsers);

// Update user role and manager assignment
router.put("/users/:id/role", updateUserRoleController);

// Soft delete user
router.delete("/users/:id", softDeleteUserController);

export default router;
