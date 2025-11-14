import express from "express";
import { prisma } from "../../db/prisma"; // ✅ Fix path
import { TaskPriority, TaskStatus } from "@prisma/client";
import { authenticate } from "../middlewares/auth.middleware";
import { AuthRequest } from "../types"; // ✅ Import AuthRequest type

const router = express.Router();

// ✅ 1. Create Task & Assign to Staff (Manager Only)
router.post("/", authenticate, async (req: AuthRequest, res) => {
  // ✅ Add AuthRequest type
  try {
    const managerId = req.user?.id;
    const { title, description, priority, dueDate, assignedToId } = req.body;

    // Check if user is manager
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager || manager.role !== "manager") {
      return res.status(403).json({ error: "Only managers can create tasks" });
    }

    // Validate input
    const errors: any[] = [];

    if (!title || title.trim().length === 0) {
      errors.push({ field: "title", message: "Title is required" });
    }
    if (!description || description.trim().length === 0) {
      errors.push({ field: "description", message: "Description is required" });
    }
    if (!priority || !["low", "medium", "high"].includes(priority)) {
      errors.push({ field: "priority", message: "Invalid priority" });
    }
    if (!dueDate) {
      errors.push({ field: "dueDate", message: "Due date is required" });
    }
    if (!assignedToId) {
      errors.push({ field: "assignedToId", message: "Please assign to a staff member" });
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    // Check if assigned user exists and is staff
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignedUser || assignedUser.role !== "staff") {
      return res.status(400).json({ error: "Invalid staff member selected" });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        priority: priority as TaskPriority,
        status: TaskStatus.todo, // Default status
        deadline: new Date(dueDate),
        createdById: managerId!,
        assignedToId: assignedToId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Map to frontend format
    const mappedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: mapStatusToFrontend(task.status),
      dueDate: task.deadline,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
    };

    return res.status(201).json({ task: mappedTask }); // ✅ Add return
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ error: "Failed to create task" }); // ✅ Add return
  }
});

// ✅ 2. Get All Tasks (Manager View)
router.get("/", authenticate, async (req: AuthRequest, res) => {
  // ✅ Add AuthRequest type
  try {
    const userId = req.user?.id;

    // Check if user is manager
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can view all tasks" });
    }

    // Get all tasks created by this manager
    const tasks = await prisma.task.findMany({
      where: {
        createdById: userId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map to frontend format
    const mappedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: mapStatusToFrontend(task.status),
      dueDate: task.deadline,
      assignedTo: task.assignedToId,
      createdAt: task.createdAt,
    }));

    return res.json({ tasks: mappedTasks }); // ✅ Add return
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({ error: "Failed to fetch tasks" }); // ✅ Add return
  }
});

// ✅ 3. Get My Tasks (Staff View)
router.get("/my-tasks", authenticate, async (req: AuthRequest, res) => {
  // ✅ Add AuthRequest type
  try {
    const userId = req.user?.id;

    // Check if user is staff
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "staff") {
      return res.status(403).json({ error: "Only staff can view assigned tasks" });
    }

    // Get tasks assigned to this staff
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map to frontend format
    const mappedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: mapStatusToFrontend(task.status),
      dueDate: task.deadline,
      createdAt: task.createdAt,
    }));

    return res.json({ tasks: mappedTasks }); // ✅ Add return
  } catch (error) {
    console.error("Get my tasks error:", error);
    return res.status(500).json({ error: "Failed to fetch tasks" }); // ✅ Add return
  }
});

// ✅ Helper: Map backend status to frontend status
function mapStatusToFrontend(status: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    [TaskStatus.todo]: "pending",
    [TaskStatus.in_progress]: "in_progress",
    [TaskStatus.pending_review]: "in_progress",
    [TaskStatus.approved]: "completed",
    [TaskStatus.rejected]: "pending",
  };
  return statusMap[status] || "pending";
}

export default router;
