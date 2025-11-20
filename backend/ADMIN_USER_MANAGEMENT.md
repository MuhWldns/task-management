# Admin Panel User Management - Implementation Guide

## 📋 Current UI Status

### ✅ Already Implemented
- [x] User Management tab in AdminPanel
- [x] Hierarchical user display (Managers → Staff)
- [x] Expandable manager cards with staff list
- [x] Edit role modal (UI only)
- [x] Delete user modal with confirmation (UI only)
- [x] Unassigned staff section
- [x] Color-coded roles (Manager: blue, Staff: green, Unassigned: orange)
- [x] Loading states and empty states
- [x] Dummy data for testing

### 🔄 Current State
- UI is complete but using dummy data
- API calls are commented out with TODO markers
- Toast notifications show "(UI only)" as placeholder

## 🛠️ Required Backend Endpoints

### 1. Get All Users with Hierarchy
```http
GET /api/admin/users
Headers: X-Admin-Secret: <secret_key>
```

**Expected Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Manager",
      "email": "john@example.com",
      "role": "manager",
      "managerId": null,
      "createdAt": "2024-01-15T10:00:00Z",
      "staff": [
        {
          "id": "uuid",
          "name": "Alice Staff",
          "email": "alice@example.com",
          "role": "staff",
          "managerId": "uuid",
          "createdAt": "2024-01-15T11:00:00Z"
        }
      ]
    },
    {
      "id": "uuid",
      "name": "Unassigned Staff",
      "email": "unassigned@example.com",
      "role": "staff",
      "managerId": null,
      "createdAt": "2024-01-16T10:00:00Z"
    }
  ]
}
```

### 2. Update User Role & Assignment
```http
PUT /api/admin/users/:id/role
Headers: 
  X-Admin-Secret: <secret_key>
  Content-Type: application/json
```

**Request Body:**
```json
{
  "role": "manager" | "staff",
  "managerId": "uuid | null" // Required only if role is "staff"
}
```

**Expected Response:**
```json
{
  "id": "uuid",
  "name": "Updated User",
  "email": "user@example.com",
  "role": "staff",
  "managerId": "uuid",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-16T12:00:00Z"
}
```

### 3. Soft Delete User
```http
DELETE /api/admin/users/:id
Headers: X-Admin-Secret: <secret_key>
```

**Expected Response:**
```json
{
  "message": "User deleted successfully",
  "user": {
    "id": "uuid",
    "name": "Deleted User",
    "email": "deleted@example.com",
    "role": "staff",
    "deletedAt": "2024-01-16T12:00:00Z"
  }
}
```

## 🏗️ Implementation Tasks

### Phase 1: Backend API Development

#### 1. Update Admin Routes (`src/routes/admin.routes.ts`)
```typescript
// Add these routes:
router.get("/users", getAllUsersWithHierarchy);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", softDeleteUser);
```

#### 2. Create Admin Controller Functions (`src/controllers/admin.controller.ts`)
```typescript
// Add these functions:
export const getAllUsersWithHierarchy = async (req: Request, res: Response) => {
  // Get all users with their staff relationships
  // Return hierarchical structure
}

export const updateUserRole = async (req: Request, res: Response) => {
  // Update user role and manager assignment
  // Handle manager → staff and staff → manager transitions
}

export const softDeleteUser = async (req: Request, res: Response) => {
  // Soft delete user with validation
  // Handle edge cases (manager with staff, etc.)
}
```

#### 3. Update Admin Service (`src/services/admin.service.ts` - create if needed)
```typescript
export const getAllUsersWithHierarchy = async () => {
  // Complex query to get users with their staff
  // Filter by deletedAt: null
  // Return hierarchical structure
}

export const updateUserRole = async (userId: string, data: UpdateUserRoleDTO) => {
  // Validate role change
  // Handle manager assignment/removal
  // Update user record
}

export const softDeleteUser = async (userId: string) => {
  // Validate user can be deleted
  // Handle edge cases
  // Set deletedAt timestamp
}
```

#### 4. Add Type Definitions (`src/types/index.ts`)
```typescript
export interface UpdateUserRoleDTO {
  role: "manager" | "staff";
  managerId?: string | null;
}

export interface UserWithStaff extends User {
  staff?: User[];
}
```

### Phase 2: Frontend Integration

#### 1. Update AdminPanel.tsx
```typescript
// Replace dummy data with actual API calls:
const fetchUsers = async () => {
  setIsLoadingUsers(true);
  try {
    const response = await fetch("http://localhost:3007/api/admin/users", {
      headers: {
        "X-Admin-Secret": secretKey,
      },
    });
    const data = await response.json();
    if (response.ok) {
      setUsers(data.users || []);
    } else {
      toast.error("Failed to load users");
    }
  } catch (error) {
    toast.error("Failed to load users");
  } finally {
    setIsLoadingUsers(false);
  }
};
```

#### 2. Update Edit Role Handler
```typescript
const handleEditRole = async () => {
  if (!editingUser) return;

  try {
    const response = await fetch(`http://localhost:3007/api/admin/users/${editingUser.id}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": secretKey,
      },
      body: JSON.stringify({
        role: newRole,
        managerId: newRole === "staff" ? newManagerId : null,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update user role");
    }

    toast.success("User role updated successfully!");
    closeEditModal();
    fetchUsers();
  } catch (error: any) {
    toast.error(error.message || "Failed to update user role");
  }
};
```

#### 3. Update Delete User Handler
```typescript
const handleDeleteUser = async () => {
  if (!deletingUser) return;

  try {
    const response = await fetch(`http://localhost:3007/api/admin/users/${deletingUser.id}`, {
      method: "DELETE",
      headers: {
        "X-Admin-Secret": secretKey,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete user");
    }

    toast.success("User deleted successfully!");
    closeDeleteModal();
    fetchUsers();
  } catch (error: any) {
    toast.error(error.message || "Failed to delete user");
  }
};
```

## 🚨 Edge Cases to Handle

### 1. Manager Deletion
- **Problem**: Manager has staff assigned
- **Solution**: 
  - Option A: Prevent deletion if manager has staff
  - Option B: Unassign all staff when manager is deleted
  - Option C: Allow deletion but show warning

### 2. Role Change Validation
- **Manager → Staff**: Must assign to another manager
- **Staff → Manager**: Remove current manager assignment
- **Staff → Staff**: Can change manager assignment

### 3. Email Uniqueness
- Soft-deleted users should not block email reuse
- Active users must have unique emails

### 4. Task Assignment
- Tasks assigned to soft-deleted users need handling
- Consider reassigning or showing warning

## 📊 Database Queries Needed

### Get Users with Hierarchy
```sql
-- Get all managers with their staff
SELECT 
  m.*,
  json_agg(
    json_build_object(
      'id', s.id,
      'name', s.name,
      'email', s.email,
      'role', s.role,
      'managerId', s.managerId,
      'createdAt', s.createdAt
    )
  ) as staff
FROM users m
LEFT JOIN users s ON s.manager_id = m.id AND s.deleted_at IS NULL
WHERE m.role = 'manager' AND m.deleted_at IS NULL
GROUP BY m.id

UNION

-- Get unassigned staff
SELECT 
  s.*,
  NULL as staff
FROM users s
WHERE s.role = 'staff' AND s.manager_id IS NULL AND s.deleted_at IS NULL
```

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test `getAllUsersWithHierarchy()` returns correct structure
- [ ] Test `updateUserRole()` handles all role transitions
- [ ] Test `softDeleteUser()` handles edge cases
- [ ] Test validation for invalid role changes

### Integration Tests
- [ ] Test admin routes with proper secret key validation
- [ ] Test complete user management flow
- [ ] Test error handling for edge cases

### Frontend Tests
- [ ] Test user list rendering with hierarchy
- [ ] Test edit role modal functionality
- [ ] Test delete modal and confirmation
- [ ] Test loading and error states

## 📝 API Documentation Updates

### Update `api.docs.md`
```markdown
## Admin User Management API

### Get All Users with Hierarchy
```http
GET /api/admin/users
```

### Update User Role
```http
PUT /api/admin/users/:id/role
```

### Soft Delete User
```http
DELETE /api/admin/users/:id
```

## 🎯 Implementation Priority

1. **Critical**: Backend API endpoints (Phase 1)
2. **High**: Frontend integration (Phase 2)
3. **Medium**: Edge case handling
4. **Low**: Testing and documentation

## 🚀 Next Steps

1. Implement backend endpoints
2. Test with Postman/Thunder Client
3. Update frontend API calls
4. Test complete user management flow
5. Handle edge cases and error scenarios
6. Add comprehensive tests
7. Update documentation

---

**Note**: This implementation assumes soft delete is already implemented. If not, complete the soft delete implementation first using `SOFT_DELETE_TODO.md`.