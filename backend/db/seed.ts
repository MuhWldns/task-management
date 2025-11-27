import { PrismaClient } from "@prisma/client";
import { UserRole, TaskPriority, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

const userData = [
  {
    id: "manager-1",
    email: "manager@taskflow.com",
    name: "Manager User",
    role: UserRole.manager,
    isVerified: true,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    id: "staff-1",
    email: "staff1@taskflow.com",
    name: "Staff User 1",
    role: UserRole.staff,
    isVerified: true,
    managerId: "manager-1",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    id: "staff-2",
    email: "staff2@taskflow.com",
    name: "Staff User 2",
    role: UserRole.staff,
    isVerified: true,
    managerId: "manager-1",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
];

const taskData = [
  {
    id: "task-1",
    title: "Setup Development Environment",
    description: "Install and configure development tools including Node.js, VS Code, and database setup",
    priority: TaskPriority.high,
    status: TaskStatus.todo,
    deadline: new Date("2024-02-01T00:00:00Z"),
    createdById: "manager-1",
    assignedToId: "staff-1",
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "task-2",
    title: "Create Landing Page",
    description: "Design and implement responsive landing page with modern UI framework",
    priority: TaskPriority.medium,
    status: TaskStatus.in_progress,
    deadline: new Date("2024-02-15T00:00:00Z"),
    createdById: "manager-1",
    assignedToId: "staff-2",
    createdAt: new Date("2024-01-20T00:00:00Z"),
    updatedAt: new Date("2024-01-22T00:00:00Z"),
  },
  {
    id: "task-3",
    title: "Implement Authentication System",
    description: "Build secure authentication system with JWT tokens and role-based access control",
    priority: TaskPriority.high,
    status: TaskStatus.completed,
    deadline: new Date("2024-01-10T00:00:00Z"),
    createdById: "manager-1",
    assignedToId: "staff-1",
    completionNotes: "Implemented JWT authentication with refresh tokens and secure password hashing. Added role-based middleware for protected routes.",
    jobResult: ["https://github.com/project-auth", "https://demo.auth-project.com"],
    completedAt: new Date("2024-01-25T00:00:00Z"),
    createdAt: new Date("2024-01-05T00:00:00Z"),
    updatedAt: new Date("2024-01-25T00:00:00Z"),
  },
];

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clean existing data
    await prisma.activityLog.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.user.deleteMany();

    // Seed users
    console.log("👥 Seeding users...");
    for (const user of userData) {
      await prisma.user.create({
        data: user,
      });
    }

    // Seed tasks
    console.log("📋 Seeding tasks...");
    for (const task of taskData) {
      await prisma.task.create({
        data: task,
      });
    }

    console.log("✅ Database seeded successfully!");
    console.log(`📊 Created ${userData.length} users and ${taskData.length} tasks`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();