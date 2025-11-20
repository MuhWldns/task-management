import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { LoginDTO, CreateUserDTO, UserWithStaff, UpdateUserRoleDTO } from "../types";
import { prisma } from "../../db/prisma"; // ✅ Fix path

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
};
export const getAllManagers = async (): Promise<Omit<User, "passwordHash">[]> => {
  const managers = await prisma.user.findMany({
    where: {
      role: "manager",
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

  return managers;
};

export const getAllUsersWithHierarchy = async (): Promise<UserWithStaff[]> => {
  // Get all managers with their staff
  const managers = await prisma.user.findMany({
    where: {
      role: "manager",
    },
    include: {
      staff: {
        where: {
          role: "staff",
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get unassigned staff (staff without manager)
  const unassignedStaff = await prisma.user.findMany({
    where: {
      role: "staff",
      managerId: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform data to match UserWithStaff interface (exclude passwordHash)
  const transformedManagers = managers.map(manager => ({
    id: manager.id,
    name: manager.name,
    email: manager.email,
    role: manager.role as "manager" | "staff",
    isVerified: manager.isVerified,
    managerId: manager.managerId,
    createdAt: manager.createdAt,
    updatedAt: manager.updatedAt,
    staff: manager.staff.map(staff => ({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role as "manager" | "staff",
      isVerified: staff.isVerified,
      managerId: staff.managerId,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    })),
  }));

  const transformedUnassignedStaff = unassignedStaff.map(staff => ({
    id: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role as "manager" | "staff",
    isVerified: staff.isVerified,
    managerId: staff.managerId,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  }));

  // Combine managers and unassigned staff
  const allUsers: UserWithStaff[] = [
    ...transformedManagers,
    ...transformedUnassignedStaff,
  ];

  return allUsers;
};

export const updateUserRole = async (userId: string, data: UpdateUserRoleDTO): Promise<Omit<User, "passwordHash">> => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  // If changing to staff, managerId is required
  if (data.role === "staff" && !data.managerId) {
    throw new Error("Manager ID is required when assigning staff role");
  }

  // If changing to manager, remove managerId
  if (data.role === "manager") {
    data.managerId = null;
  }

  // If changing managerId, validate the new manager exists and is a manager
  if (data.managerId) {
    const newManager = await prisma.user.findUnique({
      where: { id: data.managerId },
    });

    if (!newManager || newManager.role !== "manager") {
      throw new Error("Invalid manager ID");
    }
  }

  // Update user role and manager assignment
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: data.role,
      managerId: data.managerId,
    },
  });

  const { passwordHash, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

export const softDeleteUser = async (userId: string): Promise<Omit<User, "passwordHash">> => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  // If deleting a manager, check if they have staff
  if (existingUser.role === "manager") {
    const staffCount = await prisma.user.count({
      where: {
        managerId: userId,
      },
    });

    if (staffCount > 0) {
      throw new Error(`Cannot delete manager with ${staffCount} staff members. Please reassign staff first.`);
    }
  }

  // For now, we'll hard delete (remove from database)
  // TODO: Change to soft delete when deletedAt field is added to schema
  const deletedUser = await prisma.user.delete({
    where: { id: userId },
  });

  const { passwordHash, ...userWithoutPassword } = deletedUser;
  return userWithoutPassword;
};
export const getStaffByManagerId = async (managerId: string): Promise<Omit<User, "passwordHash">[]> => {
  const staff = await prisma.user.findMany({
    where: {
      managerId: managerId,
      role: "staff",
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

  return staff;
};
export const login = async (data: LoginDTO): Promise<{ user: User; token: string }> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid credentials");
  }

  const isValidPassword = await verifyPassword(data.password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error("Invalid credentials");
  }

  // if (!user.isVerified) {
  //   throw new Error("Email not verified");
  // }

  const token = generateToken(user.id);

  return { user, token };
};
export const createManager = async (data: { name: string; email: string; password: string }): Promise<User> => {
  // Check existing email
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create manager
  const manager = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      role: "manager",
      managerId: null, // Manager tidak punya manager
      isVerified: true,
    },
  });

  return manager;
};

// ✅ Service baru: Create Staff (via admin secret key dengan managerId)
export const createStaffByAdmin = async (data: { name: string; email: string; password: string; managerId: string }): Promise<User> => {
  // Check existing email
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Validate manager exists and is actually a manager
  const manager = await prisma.user.findUnique({
    where: { id: data.managerId },
  });

  if (!manager) {
    throw new Error("Manager not found");
  }

  if (manager.role !== "manager") {
    throw new Error("Invalid manager ID. User is not a manager");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create staff
  const staff = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      role: "staff",
      managerId: data.managerId,
      isVerified: true,
    },
  });

  return staff;
};

export const createUser = async (data: CreateUserDTO): Promise<User> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await hashPassword(data.password);
  const name = data.email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, " ") // Replace special chars with space
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  const user = await prisma.user.create({
    data: {
      name: name,
      email: data.email,
      passwordHash: hashedPassword,
      role: data.role,
      managerId: data.managerId,
      isVerified: true,
    },
  });

  // In a real application, send verification email here
  // For now, just log the verification link
  // console.log(`Verification link for ${user.email}: http://localhost:3007/verify-email/${user.id}`);

  return user;
};

export const verifyEmail = async (userId: string): Promise<User> => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });

  return user;
};
