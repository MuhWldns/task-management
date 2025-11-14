import { PrismaClient, User } from "@prisma/client";
import { UpdateUserDTO, ChangePasswordDTO } from "../types";
import { hashPassword, verifyPassword } from "./auth.service";

const prisma = new PrismaClient();

export const getUserProfile = async (userId: string): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateUserProfile = async (userId: string, data: UpdateUserDTO): Promise<User> => {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Update user data
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name || user.name, // Keep existing name if not provided
    },
  });

  return updatedUser;
};

export const changePassword = async (userId: string, data: ChangePasswordDTO): Promise<User> => {
  // Verify user exists and current password is correct
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.passwordHash) {
    throw new Error("User not found");
  }

  const isValidPassword = await verifyPassword(data.currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new Error("Current password is incorrect");
  }

  // Update password
  const newPasswordHash = await hashPassword(data.newPassword);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
    },
  });

  return updatedUser;
};

export const listUsers = async (managerId: string, page: number = 1, limit: number = 10, search?: string): Promise<{ users: User[]; total: number }> => {
  // Verify manager exists
  const manager = await prisma.user.findFirst({
    where: { id: managerId, role: "manager" },
  });

  if (!manager) {
    throw new Error("Unauthorized access");
  }

  // Build where clause for search
  const where = {
    managerId,
    ...(search && {
      OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }],
    }),
  };

  // Get total count
  const total = await prisma.user.count({ where });

  // Get paginated results
  const users = await prisma.user.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  return { users, total };
};
