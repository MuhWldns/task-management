import { prisma } from "../../db/prisma";
import { TaskStatus } from "@prisma/client";

// Get task by ID
export const getTaskById = async (taskId: string) => {
  return await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
  });
};

// Update task status (for staff to mark as pending_review)
export const updateTaskStatus = async (taskId: string, userId: string, newStatus: TaskStatus, completionNotes?: string, jobResult?: string[]) => {
  // Get the task first
  const task = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    include: {
      assignedTo: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Check if user is assigned to this task and user is not deleted
  if (task.assignedToId !== userId || task.assignedTo?.deletedAt) {
    throw new Error("You can only update your assigned tasks");
  }

  // Validate status transitions
  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.todo]: [TaskStatus.in_progress],
    [TaskStatus.in_progress]: [TaskStatus.pending_review],
    [TaskStatus.pending_review]: [], // Can't change from pending_review
    [TaskStatus.approved]: [], // Can't change from approved
    [TaskStatus.rejected]: [TaskStatus.todo, TaskStatus.in_progress], // Can restart rejected tasks
  };

  if (!validTransitions[task.status].includes(newStatus)) {
    throw new Error("Invalid status transition");
  }

  // Update the task
  const updateData: any = {
    status: newStatus,
    updatedAt: new Date(),
  };

  // If marking as pending_review, set completedAt and save completion notes + job results
  if (newStatus === TaskStatus.pending_review) {
    updateData.completedAt = new Date();
    if (completionNotes) {
      updateData.completionNotes = completionNotes;
    }
    if (jobResult) {
      updateData.jobResult = jobResult;
    }
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
      deletedAt: null
    },
    data: updateData,
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

  // Create activity log for status change
  await prisma.activityLog.create({
    data: {
      action: `task_status_update`,
      oldValue: task.status,
      newValue: newStatus,
      taskId: taskId,
      userId: userId,
      deletedAt: null,
    },
  });

  return updatedTask;
};

  // Get tasks pending review (for managers)
export const getPendingReviewTasks = async (managerId: string) => {
  // Verify user is a manager
  const manager = await prisma.user.findUnique({
    where: { id: managerId, deletedAt: null },
  });

  if (!manager || manager.role !== "manager") {
    throw new Error("Only managers can view pending review tasks");
  }

  // Get tasks that are pending review for this manager's staff
  const pendingTasks = await prisma.task.findMany({
    where: {
      status: TaskStatus.pending_review,
      deletedAt: null,
      assignedTo: {
        managerId: managerId,
        deletedAt: null,
      },
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
    orderBy: {
      completedAt: "desc",
    },
  });

  return pendingTasks;
};

// Review task (approve/reject) - for managers
export const reviewTask = async (taskId: string, managerId: string, action: "approve" | "reject", reviewNotes?: string) => {
  // Get the task first
  const task = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    include: {
      assignedTo: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Check if task is in pending_review status
  if (task.status !== TaskStatus.pending_review) {
    throw new Error("Only tasks in pending_review status can be reviewed");
  }

  // Verify the manager is the manager of the assigned staff and staff is not deleted
  if (!task.assignedTo || task.assignedTo.deletedAt || task.assignedTo.managerId !== managerId) {
    throw new Error("You can only review tasks assigned to your staff");
  }

  // Update the task status
  const newStatus = action === "approve" ? TaskStatus.approved : TaskStatus.rejected;

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
      deletedAt: null
    },
    data: {
      status: newStatus,
      updatedAt: new Date(),
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

  // Create activity log for the review
  await prisma.activityLog.create({
    data: {
      action: `task_${action}`,
      oldValue: task.status,
      newValue: newStatus,
      taskId: taskId,
      userId: managerId,
      deletedAt: null,
    },
  });

  return updatedTask;
};

// Check if task is overdue
export const isTaskOverdue = (deadline: Date | null): boolean => {
  if (!deadline) return false;
  return new Date() > deadline;
};

// Validate task action based on deadline
export const validateTaskAction = (deadline: Date | null): { canAct: boolean; message?: string } => {
  if (isTaskOverdue(deadline)) {
    return {
      canAct: false,
      message: "Cannot perform action on overdue tasks",
    };
  }
  return { canAct: true };
};