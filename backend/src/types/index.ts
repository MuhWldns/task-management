import { Request } from "express";
import { User } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: "manager" | "staff";
  managerId?: string;
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface CreateTaskDTO {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assignedToId: string;
  deadline?: Date;
}

export interface UpdateTaskStatusDTO {
  status: "todo" | "in_progress" | "pending_review" | "approved" | "rejected";
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: Date;
  assignedToId?: string;
}

export interface UserWithStaff {
  id: string;
  name: string;
  email: string;
  role: "manager" | "staff";
  isVerified: boolean;
  managerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  staff?: UserWithStaff[];
}

export interface UpdateUserRoleDTO {
  role: "manager" | "staff";
  managerId?: string | null;
}

export interface CreateCommentDTO {
  message: string;
  taskId: string;
}

export interface ActivityLogDTO {
  action: string;
  taskId?: string;
  oldValue?: string;
  newValue?: string;
}
