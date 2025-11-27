import { Request, Response } from "express";
import { TaskStatus } from "@prisma/client";
import { AuthRequest } from "../types";
import { getTaskById, updateTaskStatus as updateTaskStatusService, getPendingReviewTasks as getPendingReviewTasksService, reviewTask as reviewTaskService, validateTaskAction } from "../services/task.service";

// Update task status (PUT /api/tasks/:id/status)
export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, completionNotes, jobResult } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!status || !Object.values(TaskStatus).includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Check deadline validation
    const task = await getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const deadlineValidation = validateTaskAction(task.deadline);
    if (!deadlineValidation.canAct) {
      return res.status(400).json({ error: deadlineValidation.message });
    }

    const updatedTask = await updateTaskStatusService(id, userId, status as TaskStatus, completionNotes, jobResult);

    // Map to frontend format
    const mappedTask = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      status: mapStatusToFrontend(updatedTask.status),
      dueDate: updatedTask.deadline,
      completedAt: updatedTask.completedAt,
      completionNotes: updatedTask.completionNotes,
      jobResult: updatedTask.jobResult,
      assignedTo: updatedTask.assignedTo,
      createdBy: updatedTask.createdBy,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
    };

    return res.json({ task: mappedTask });
  } catch (error: any) {
    console.error("Update task status error:", error);
    return res.status(400).json({ error: error.message || "Failed to update task status" });
  }
};

// Get pending review tasks (GET /api/tasks/pending-review)
export const getPendingReviewTasks = async (req: AuthRequest, res: Response) => {
  try {
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const pendingTasks = await getPendingReviewTasksService(managerId);

    // Map to frontend format
    const mappedTasks = pendingTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: mapStatusToFrontend(task.status),
      dueDate: task.deadline,
      completedAt: task.completedAt,
      completionNotes: task.completionNotes,
      jobResult: task.jobResult,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return res.json({ tasks: mappedTasks });
  } catch (error: any) {
    console.error("Get pending review tasks error:", error);
    return res.status(400).json({ error: error.message || "Failed to fetch pending review tasks" });
  }
};

// Review task (PUT /api/tasks/:id/review)
export const reviewTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reviewNotes } = req.body;
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
    }

    const reviewedTask = await reviewTaskService(
      id,
      managerId,
      action as "approve" | "reject",
      reviewNotes
    );

    // Map to frontend format
    const mappedTask = {
      id: reviewedTask.id,
      title: reviewedTask.title,
      description: reviewedTask.description,
      priority: reviewedTask.priority,
      status: mapStatusToFrontend(reviewedTask.status),
      dueDate: reviewedTask.deadline,
      completedAt: reviewedTask.completedAt,
      completionNotes: reviewedTask.completionNotes,
      jobResult: reviewedTask.jobResult,
      assignedTo: reviewedTask.assignedTo,
      createdBy: reviewedTask.createdBy,
      createdAt: reviewedTask.createdAt,
      updatedAt: reviewedTask.updatedAt,
    };

    return res.json({ task: mappedTask });
  } catch (error: any) {
    console.error("Review task error:", error);
    return res.status(400).json({ error: error.message || "Failed to review task" });
  }
};

// Helper: Map backend status to frontend status
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