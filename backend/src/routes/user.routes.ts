import express from "express";
import { prisma } from "../../db/prisma"; // ✅ Fix path
import { authenticate } from "../middlewares/auth.middleware";
import { requireVerifiedEmail } from "../middlewares/verification.middleware";
import { AuthRequest } from "../types";

const router = express.Router();

// ✅ GET /api/users/staff - Get all staff (Manager only) - Requires verification
router.get("/staff", authenticate, requireVerifiedEmail, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // ✅ Verify user is manager
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Manager access required" });
    }

    // ✅ Get ONLY staff under this manager
    const staff = await prisma.user.findMany({
      where: {
        role: "staff",
        managerId: req.user.id, // ✅ Filter by current manager's ID
        deletedAt: null, // ✅ Only active staff
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ staff });
  } catch (error: any) {
    console.error("Failed to fetch staff:", error);
    return res.status(500).json({ error: "Failed to fetch staff" });
  }
});
export default router;
