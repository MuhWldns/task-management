# TODO: Soft Delete Implementation

## 📋 High Priority Tasks (Critical for Functionality)

### 1. Update Schema with Soft Delete Fields
- [ ] Add `deletedAt DateTime?` to User model in `schema.prisma`
- [ ] Add `deletedAt DateTime?` to Task model in `schema.prisma`
- [ ] Add `deletedAt DateTime?` to Comment model in `schema.prisma`
- [ ] Add `deletedAt DateTime?` to ActivityLog model in `schema.prisma` (optional)
- [ ] Run migration: `npx prisma migrate dev --name add_soft_delete`

### 2. Update Auth Service (`src/services/auth.service.ts`)
- [ ] **getAllManagers()** - Add `deletedAt: null` filter
- [ ] **createManager()** - Check duplicate email on active users only
- [ ] **createStaff()** - Check duplicate email & valid manager (active only)
- [ ] **createStaffByAdmin()** - Check duplicate email & valid manager (active only)
- [ ] **login()** - Only allow login for active users (`deletedAt: null`)
- [ ] **verifyEmail()** - Verify only active users

### 3. Update Auth Middleware (`src/middlewares/auth.middleware.ts`)
- [ ] **authenticate()** - Add `deletedAt: null` filter when finding user by JWT token

### 4. Update User Routes (`src/routes/user.routes.ts`)
- [ ] **GET /staff** - Add `deletedAt: null` filter for staff listing

## 📋 Medium Priority Tasks (User Management)

### 5. Update User Service (`src/services/user.service.ts`)
- [ ] **getUserProfile()** - Add `deletedAt: null` filter
- [ ] **updateUserProfile()** - Add `deletedAt: null` filter
- [ ] **changePassword()** - Add `deletedAt: null` filter

### 6. Update Task Routes (`src/routes/task.routes.ts`)
- [ ] **POST / (Create Task)** - Validate assigned staff is active (`deletedAt: null`)
- [ ] **GET / (Get Tasks)** - Add `deletedAt: null` filter
- [ ] **PUT /:id (Update Task)** - Add `deletedAt: null` filter
- [ ] **DELETE /:id (Delete Task)** - Implement soft delete instead of hard delete

### 7. Add New Admin User Management APIs
- [ ] **GET /api/admin/users** - Get all users with hierarchy (active only)
- [ ] **PUT /api/admin/users/:id/role** - Update user role & manager assignment
- [ ] **DELETE /api/admin/users/:id** - Soft delete user
- [ ] **GET /api/admin/users/:id** - Get single user details

## 📋 Low Priority Tasks (Testing & Data)

### 8. Update Test Setup (`src/__tests__/setup.ts`)
- [ ] Update TRUNCATE queries to handle soft delete properly
- [ ] Add cleanup for `deletedAt` field in test data

### 9. Update Seed File (`prisma/seed.ts`)
- [ ] Add `deletedAt: null` to all user creation queries
- [ ] Add `deletedAt: null` to all task creation queries
- [ ] Optionally create some soft-deleted test data

### 10. Update Admin Controller (`src/controllers/admin.controller.ts`)
- [ ] Add controller functions for new user management APIs
- [ ] Add proper error handling for soft delete operations

## 📋 Frontend Integration Tasks

### 11. Update Admin Panel UI
- [ ] Replace dummy data with actual API calls in `AdminPanel.tsx`
- [ ] Update `fetchUsers()` to call new `/api/admin/users` endpoint
- [ ] Update edit role modal to call PUT `/api/admin/users/:id/role`
- [ ] Update delete modal to call DELETE `/api/admin/users/:id`
- [ ] Handle loading states and error messages properly

### 12. Update API Documentation
- [ ] Update `api.docs.md` with new admin endpoints
- [ ] Document soft delete behavior
- [ ] Update response examples to include `deletedAt` field

## 📋 Edge Cases & Validation

### 13. Handle Edge Cases
- [ ] **Manager Deletion**: What happens to staff when manager is soft-deleted?
- [ ] **Task Assignment**: Handle tasks assigned to soft-deleted users
- [ ] **Email Uniqueness**: Allow reuse of emails from soft-deleted users
- [ ] **Reporting**: Ensure reports exclude soft-deleted data

### 14. Add Soft Delete Utility Functions
- [ ] Create `softDeleteUser()` function in `auth.service.ts`
- [ ] Create `softDeleteTask()` function in task service
- [ ] Create `restoreUser()` function (optional)
- [ ] Create `restoreTask()` function (optional)

## 📋 Testing Tasks

### 15. Update Tests
- [ ] Update existing tests to account for soft delete behavior
- [ ] Add tests for new admin user management APIs
- [ ] Add tests for soft delete functionality
- [ ] Add tests for edge cases (orphaned staff, etc.)

## 📋 Deployment & Migration

### 16. Production Deployment
- [ ] Test migration on staging environment first
- [ ] Backup production database before migration
- [ ] Plan rollback strategy if migration fails
- [ ] Update any existing cron jobs or background tasks

## 🚨 Critical Notes

1. **Email Uniqueness**: Consider if deleted emails can be reused
2. **Foreign Key Constraints**: Ensure `deletedAt` doesn't break relations
3. **Performance**: Add database indexes on `deletedAt` columns
4. **Backward Compatibility**: Ensure existing APIs still work
5. **Data Integrity**: Validate all foreign key references after soft delete

## 📊 Implementation Order

1. **Phase 1**: Schema + Migration + Core Auth (Tasks 1-4)
2. **Phase 2**: User Management APIs + Task Updates (Tasks 5-7)
3. **Phase 3**: Frontend Integration + Testing (Tasks 8-12)
4. **Phase 4**: Edge Cases + Deployment (Tasks 13-16)

---

**Remember**: After implementing soft delete, all `findMany`, `findUnique`, `findFirst` queries should include `deletedAt: null` filter unless you specifically need to access deleted data.