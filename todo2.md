# TODO: Backend API Endpoints for Task Management

## 1. ✅ Update Task Status Endpoint

**Endpoint:** `PUT /api/tasks/:id/status`

**Purpose:**

- Staff bisa update status task (pending → in_progress → completed)
- Validasi: hanya staff yang assigned bisa update
- Kalau status = completed, wajib kasih completionNotes

**Request Body:**

```json
{
  "status": "in_progress" | "completed",
  "completionNotes": "string (required if status = completed, min 10 chars)"
}
```

**Response:**

```json
{
  "task": {
    "id": "string",
    "title": "string",
    "status": "in_progress" | "completed",
    "completionNotes": "string",
    "completedAt": "DateTime",
    ...
  }
}
```

**Validation:**

- ✅ Check if user is staff
- ✅ Check if task assigned to this staff
- ✅ If status = completed, completionNotes required (min 10 chars)
- ✅ Auto set completedAt timestamp

**Database Changes Needed:**

```prisma
model Task {
  // ...existing fields...
  completionNotes String?   // Staff notes when completing
  completedAt     DateTime? // Auto timestamp
}
```

**Migration Command:**

```bash
npx prisma migrate dev --name add_completion_notes
npx prisma generate
```

---

## 2. ⚠️ Update Get Tasks Endpoint (Optional)

**Endpoint:** `GET /api/tasks/my-tasks`

**Purpose:**

- Return completionNotes & completedAt di response

**Changes Needed:**

```typescript
// Add to response mapping
{
  id: task.id,
  title: task.title,
  description: task.description,
  status: mapStatusToFrontend(task.status),
  priority: task.priority,
  dueDate: task.deadline,
  completionNotes: task.completionNotes,  // ✅ Add this
  completedAt: task.completedAt,          // ✅ Add this
  createdAt: task.createdAt,
}
```

---

## 📝 Implementation Steps:

### Step 1: Update Database Schema

1. Add fields to `schema.prisma`:
   - `completionNotes String?`
   - `completedAt DateTime?`
2. Run migration: `npx prisma migrate dev --name add_completion_notes`
3. Generate client: `npx prisma generate`

### Step 2: Update Backend Route

File: `backend/src/routes/task.routes.ts`

Add/Update endpoint:

```typescript
router.put("/:id/status", authenticate, async (req: AuthRequest, res) => {
  const { status, completionNotes } = req.body;

  // Validation logic here
  // - Check if staff
  // - Check if task assigned to user
  // - Validate completionNotes if status = completed

  // Update task
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      completionNotes: status === "completed" ? completionNotes : null,
      completedAt: status === "completed" ? new Date() : null,
    },
  });

  return res.json({ task: updatedTask });
});
```

### Step 3: Update Frontend

File: `fe-nextjs/app/staff/page.tsx`

Replace dummy functions:

```typescript
// Remove DUMMY functions
// Replace with real API calls to PUT /api/tasks/:id/status
```

---

## 🎯 Summary:

**Endpoints to Create:**

1. ✅ `PUT /api/tasks/:id/status` - Update task status & completion notes

**Database Changes:**

1. ✅ Add `completionNotes` field (String?)
2. ✅ Add `completedAt` field (DateTime?)

**Frontend Changes:**

1. ✅ Replace dummy functions with real API calls
2. ✅ Handle loading states
3. ✅ Handle errors

---

## 🔥 Priority:

**HIGH:**

- PUT /api/tasks/:id/status endpoint (critical for staff workflow)

**MEDIUM:**

- Update GET /api/tasks/my-tasks to include new fields

**LOW:**

- Add activity logs for status changes
- Add notifications for managers when task completed

---
