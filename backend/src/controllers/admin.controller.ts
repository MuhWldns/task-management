import { Request, Response } from "express";
import { createManager, createStaffByAdmin, getAllUsersWithHierarchy, updateUserRole, softDeleteUser } from "../services/auth.service";
import { UpdateUserRoleDTO } from "../types";

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

export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const users = await getAllUsersWithHierarchy();
    return res.json({ users });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const updateUserRoleController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const roleData: UpdateUserRoleDTO = req.body;

    // Validate input
    if (!roleData.role || !["manager", "staff"].includes(roleData.role)) {
      return res.status(400).json({ error: "Valid role (manager or staff) is required" });
    }

    const updatedUser = await updateUserRole(id, roleData);
    return res.json(updatedUser);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const softDeleteUserController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const deletedUser = await softDeleteUser(id);
    return res.json({
      message: "User deleted successfully",
      user: deletedUser
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
