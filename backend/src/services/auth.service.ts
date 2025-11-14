import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { LoginDTO, CreateUserDTO } from "../types";
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
