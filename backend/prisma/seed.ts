import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  // Clean up existing data
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create manager
  const managerPassword = await hashPassword("manager123");
  const manager = await prisma.user.create({
    data: {
      name: "John Manager",
      email: "manager@example.com",
      passwordHash: managerPassword,
      role: "manager",
      isVerified: true,
    },
  });

  // Create staff members
  const staffPassword = await hashPassword("staff123");
  const staff1 = await prisma.user.create({
    data: {
      name: "Alice Staff",
      email: "alice@example.com",
      passwordHash: staffPassword,
      role: "staff",
      managerId: manager.id,
      isVerified: true,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      name: "Bob Staff",
      email: "bob@example.com",
      passwordHash: staffPassword,
      role: "staff",
      managerId: manager.id,
      isVerified: true,
    },
  });

  // Create unverified staff
  const unverifiedStaff = await prisma.user.create({
    data: {
      name: "Carol Staff",
      email: "carol@example.com",
      passwordHash: staffPassword,
      role: "staff",
      managerId: manager.id,
      isVerified: false,
    },
  });

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      title: "Implement Login Page",
      description: "Create a responsive login page with email and password fields",
      priority: "high",
      status: "in_progress",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdById: manager.id,
      assignedToId: staff1.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Design Database Schema",
      description: "Create ERD and implement database migrations",
      priority: "medium",
      status: "pending_review",
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      createdById: manager.id,
      assignedToId: staff2.id,
    },
  });

  // Create comments
  await prisma.comment.create({
    data: {
      message: "Added form validation",
      taskId: task1.id,
      userId: staff1.id,
    },
  });

  await prisma.comment.create({
    data: {
      message: "Please add password strength indicator",
      taskId: task1.id,
      userId: manager.id,
    },
  });

  // Create activity logs
  await prisma.activityLog.create({
    data: {
      action: "create_task",
      taskId: task1.id,
      userId: manager.id,
      newValue: "Task created and assigned to Alice",
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "update_status",
      taskId: task2.id,
      userId: staff2.id,
      oldValue: "in_progress",
      newValue: "pending_review",
    },
  });

  console.log("Seed data created successfully!");
  console.log("Test accounts:");
  console.log("Manager: manager@example.com / manager123");
  console.log("Staff 1: alice@example.com / staff123");
  console.log("Staff 2: bob@example.com / staff123");
  console.log("Unverified: carol@example.com / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
