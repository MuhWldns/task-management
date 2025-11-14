import { Request, Response } from "express";
import { createManager, createStaffByAdmin } from "../services/auth.service";

export const registerManager = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const manager = await createManager({ name, email, password });
    const { passwordHash, ...managerWithoutPassword } = manager;

    return res.status(201).json(managerWithoutPassword);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const createStaffViaAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password, managerId } = req.body;

    if (!name || !email || !password || !managerId) {
      return res.status(400).json({
        error: "Name, email, password, and managerId are required",
      });
    }

    const staff = await createStaffByAdmin({ name, email, password, managerId });
    const { passwordHash, ...staffWithoutPassword } = staff;

    return res.status(201).json(staffWithoutPassword);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
