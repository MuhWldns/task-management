# 📋 Task Management System

A comprehensive task management application with role-based access control (Admin, Manager, Staff) built with modern web technologies. Features soft delete functionality and comprehensive task workflow management.

---

## 🚀 Tech Stack

### **Frontend**

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Notifications**: Sonner (Toast)
- **Security**: Cloudflare Turnstile (Captcha)
- **Icons**: Lucide React

### **Backend**

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Security**: express-rate-limit, cookie-parser

### **Development Tools**

- **Package Manager**: npm
- **Linting**: ESLint
- **Code Formatting**: Prettier
- **Version Control**: Git
- **Password Reset**: 🆕 Secure token-based password recovery system

---

## 📁 Project Structure

```
task-management/
├── backend/
│   ├── db/
│   │   └── prisma.ts              # Prisma client singleton
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema with soft delete
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts # Authentication logic
│   │   │   ├── admin.controller.ts # Admin operations
│   │   │   ├── passwordReset.controller.ts # 🆕 Password reset logic
│   │   │   ├── task.controller.ts # Task CRUD operations
│   │   │   └── verification.controller.ts # Email verification logic
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts # Auth & validation middleware
│   │   │   └── verification.middleware.ts # Email verification middleware
│   │   ├── routes/
│   │   │   ├── auth.routes.ts     # Authentication routes
│   │   │   ├── admin.routes.ts    # Admin routes
│   │   │   ├── user.routes.ts     # User management routes
│   │   │   ├── task.routes.ts     # Task management routes
│   │   │   └── verification.routes.ts # Email verification routes
│   │   ├── services/
│   │   │   ├── auth.service.ts    # Business logic for auth
│   │   │   ├── passwordReset.service.ts # 🆕 Password reset business logic
│   │   │   ├── user.service.ts    # User management logic
│   │   │   ├── task.service.ts    # Task management logic
│   │   │   └── verification.service.ts # Email verification service
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript type definitions
│   │   ├── utils/
│   │   │   ├── verifyTurnstile.ts # Captcha verification
│   │   │   ├── verificationToken.ts # Token generation & validation
│   │   │   ├── passwordResetToken.ts # 🆕 Password reset token utilities
│   │   │   └── emailService.ts   # 🔄 Email sending service (updated)
│   │   └── index.ts               # Express server entry point
│   ├── .env                       # Environment variables
│   └── package.json
│
└── fe-nextjs/
    ├── app/
    │   ├── admin/
    │   │   ├── AdminPanel.tsx     # Admin dashboard
    │   │   ├── SecretKeyForm.tsx  # Admin authentication
    │   │   └── page.tsx           # Admin page
    │   ├── manager/
    │   │   ├── page.tsx           # Manager dashboard
    │   │   ├── tasks/
    │   │   │   └── page.tsx       # Task management
    │   │   └── staff/
    │   │       └── page.tsx       # Staff management
    │   ├── staff/
    │   │   └── page.tsx           # Staff dashboard
    │   ├── login/
    │   │   └── page.tsx           # Login page (🔄 updated with forgot password link)
    │   ├── forgot-password/
    │   │   └── page.tsx           # 🆕 Forgot password request page
    │   ├── reset-password/
    │   │   └── page.tsx           # 🆕 Password reset form page
    │   ├── please-verify/
    │   │   └── page.tsx           # Email verification page
    │   ├── verify-email/
    │   │   └── page.tsx           # Email verification trigger
    │   ├── layout.tsx             # Root layout
    │   └── page.tsx               # Home page
    ├── components/
    │   ├── ui/                    # shadcn/ui components
    │   ├── ProtectedRoute.tsx    # Route protection component
    │   └── LoginButton.tsx        # Login button component
    ├── .env.local                 # Frontend environment variables
    └── package.json
```

---

## 🔐 User Roles & Permissions

### **1. Admin (Super User)**

- **Authentication**: Secret Key (X-Admin-Secret header)
- **Permissions**:
  - Create managers
  - Create staff with manager assignment
  - View all managers
  - Full system access

### **2. Manager**

- **Authentication**: Email/Password + JWT Cookie
- **Permissions**:
  - Create staff under their management
  - View only their own staff
  - Create and assign tasks to their staff
  - View all tasks they created
  - Manage their own profile

### **3. Staff**

- **Authentication**: Email/Password + JWT Cookie
- **Permissions**:
  - View tasks assigned to them
  - Update task status (todo → in_progress → pending_review → approved/rejected)
  - Add completion notes and job results
  - View their own profile
  - Cannot create or assign tasks

---

## 🗄️ Database Schema

### **User Model**

```typescript
interface User {
  id: string              // UUID
  name: string
  email: string           // Unique
  passwordHash?: string   // Optional for OAuth
  role: 'manager' | 'staff'
  isVerified: boolean     // Default: false
  verificationToken?: string    // Email verification token
  verificationTokenExpires?: DateTime  // Token expiry
  managerId?: string      // Self-relation for manager-staff
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt?: DateTime    // Soft delete field
}
```

### **Task Model**

```typescript
interface Task {
  id: string                    // UUID
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'pending_review' | 'approved' | 'rejected'
  deadline?: DateTime
  completedAt?: DateTime
  completionNotes?: string
  jobResult: string[]          // Array of job result URLs/data
  createdById: string          // Manager who created the task
  assignedToId: string         // Staff assigned to the task
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt?: DateTime         // Soft delete field
}
```

### **Comment Model**

```typescript
interface Comment {
  id: string          // UUID
  message: string
  taskId: string      // Foreign key to Task
  userId: string      // Foreign key to User
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt?: DateTime // Soft delete field
}
```

### **ActivityLog Model**

```typescript
interface ActivityLog {
  id: string          // UUID
  action: string      // Description of action
  oldValue?: string   // Previous value (for updates)
  newValue?: string   // New value (for updates)
  taskId?: string     // Optional foreign key to Task
  userId: string      // Foreign key to User
  createdAt: DateTime
  deletedAt?: DateTime // Soft delete field
}
```

---

## 🔄 Task Status Workflow

```mermaid
graph TD
    A[todo] --> B[in_progress]
    B --> C[pending_review]
    C --> D{Review Decision}
    D -->|Approved| E[approved]
    D -->|Rejected| F[rejected]
    F --> B
    E --> G[completedAt set]
```

**Status Descriptions:**

- **`todo`**: Initial state, task created but not started
- **`in_progress`**: Staff is actively working on the task
- **`pending_review`**: Task completed, waiting for manager review
- **`approved`**: Task approved by manager, marked as completed
- **`rejected`**: Task rejected by manager, returns to `in_progress`

---

## 🗑️ Soft Delete Implementation

All main models (`User`, `Task`, `Comment`, `ActivityLog`) implement soft delete functionality:

### **How It Works**

1. **Deletion**: Instead of permanent deletion, `deletedAt` field is set to current timestamp
2. **Filtering**: All queries automatically filter out deleted records (`deletedAt: null`)
3. **Recovery**: Deleted records can be recovered by setting `deletedAt` to `null`
4. **Integrity**: Maintains data integrity and audit trails

### **Automatic Filtering**

All database queries automatically include `deletedAt: null` filter:

```typescript
// Example: Only active users are returned
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});

// Example: Login only works for active users
const user = await prisma.user.findFirst({
  where: {
    email: data.email,
    deletedAt: null
  }
});
```

### **Benefits**

- **Data Recovery**: Accidentally deleted users/tasks can be restored
- **Audit Trail**: Complete history of all actions is preserved
- **Compliance**: Meets data retention requirements
- **Analytics**: Historical data analysis remains possible

---

## 🌊 Application Flow

### **1. Admin Flow**

```mermaid
graph TD
    A[Admin visits /admin] --> B[Enter Secret Key]
    B --> C{Verify Secret Key}
    C -->|Valid| D[Admin Dashboard]
    C -->|Invalid| B
    D --> E[Create Manager]
    D --> F[Create Staff with Manager]
    E --> G[Manager Registered]
    F --> H[Staff Assigned to Manager]
```

**Steps**:

1. Admin navigates to `/admin`
2. Enters secret key (stored in `sessionStorage`)
3. Secret key validated via `X-Admin-Secret` header
4. Access admin dashboard
5. Create managers or staff with manager assignment

---

### **2. Manager Flow**

```mermaid
graph TD
    A[Manager visits /login] --> B[Enter Email/Password + Captcha]
    B --> C{Verify Credentials}
    C -->|Valid| D[JWT Token in Cookie]
    C -->|Invalid| B
    D --> E{Check Email Verification}
    E -->|Verified| F[Redirect to /manager]
    E -->|Not Verified| G[Redirect to /please-verify]
    F --> H{Verify Role}
    H -->|Manager| I[Manager Dashboard]
    H -->|Not Manager| J[Redirect to /staff]
    G --> K[Verification Page]
    K --> L[Request New Email]
    K --> M[Check Verification Status]
    L --> N[Email Sent]
    M --> O{Email Verified?}
    O -->|Yes| F
    O -->|No| K
    I --> P[View Staff List]
    I --> Q[Create/Manage Tasks]
    P --> R[Only See Own Staff]
```

**Steps**:

1. Manager logs in with email/password + Turnstile captcha
2. Backend validates credentials & issues JWT token (httpOnly cookie)
3. **Email Verification Check**:
   - If verified → Redirect to `/manager`
   - If not verified → Redirect to `/please-verify`
4. **Verification Flow**:
   - User can request new verification email
   - User can check verification status
   - Click email link → `/verify-email?token=xxx`
   - Auto-verify → Redirect to login
5. Verify role via `/api/auth/me` endpoint
6. Load dashboard with staff & tasks
7. Manager can only see staff with `managerId = manager.id`

**Email Verification Process**:

```mermaid
graph TD
    A[User Registration] --> B[Send Verification Email]
    B --> C[Email with Verification Link]
    C --> D[User Clicks Link]
    D --> E["/verify-email?token=xxx"]
    E --> F[Call Backend API]
    F --> G[Update isVerified: true]
    G --> H[Redirect to Login]
    H --> I[User Can Login Successfully]
```

---

### **3. Staff Flow**

```mermaid
graph TD
    A[Staff visits /login] --> B[Enter Email/Password + Captcha]
    B --> C{Verify Credentials}
    C -->|Valid| D[JWT Token in Cookie]
    C -->|Invalid| B
    D --> E{Check Email Verification}
    E -->|Verified| F[Redirect to /staff]
    E -->|Not Verified| G[Redirect to /please-verify]
    F --> H{Verify Role}
    H -->|Staff| I[Staff Dashboard]
    H -->|Not Staff| J[Redirect to /manager]
    G --> K[Verification Page]
    K --> L[Request New Email]
    K --> M[Check Verification Status]
    L --> N[Email Sent]
    M --> O{Email Verified?}
    O -->|Yes| F
    O -->|No| K
    I --> P[View Assigned Tasks]
    P --> Q[Update Task Status]
    Q --> R[Add Completion Notes]
    R --> S[Submit for Review]
```

**Steps**:

1. Staff logs in with email/password + Turnstile captcha
2. Backend validates & issues JWT token
3. **Email Verification Check**:
   - If verified → Redirect to `/staff`
   - If not verified → Redirect to `/please-verify`
4. **Verification Flow**:
   - User can request new verification email
   - User can check verification status
   - Click email link → `/verify-email?token=xxx`
   - Auto-verify → Redirect to login
5. Verify role via `/api/auth/me`
6. Load tasks where `assignedToId = staff.id`
7. Update task status through the workflow:
   - `todo` → `in_progress` (start working)
   - `in_progress` → `pending_review` (submit for review)
   - `pending_review` → `approved`/`rejected` (manager decision)
   - If rejected, back to `in_progress`

---

## 🔌 Password Reset Endpoints

| Method | Endpoint                              | Auth          | Description                            |
| ------ | ------------------------------------- | ------------- | -------------------------------------- |
| `POST` | `/api/auth/forgot-password`             | Public        | Request password reset email            |
| `POST` | `/api/auth/validate-reset-token`        | Public        | Validate password reset token           |
| `POST` | `/api/auth/reset-password`              | Public        | Reset password with token              |

#### **Forgot Password Example**

**Request:**

```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com",
  "turnstileToken": "cloudflare-turnstile-token"
}
```

**Response:**

```json
{
  "message": "Password reset link sent to your email."
}
```

#### **Validate Reset Token Example**

**Request:**

```bash
POST /api/auth/validate-reset-token
Content-Type: application/json

{
  "token": "1175067baa7d81d6d65aa499ace98b484cd23930cd7373c6167357b5dbc39f9f"
}
```

**Response:**

```json
{
  "message": "Token is valid"
}
```

#### **Reset Password Example**

**Request:**

```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "1175067baa7d81d6d65aa499ace98b484cd23930cd7373c6167357b5dbc39f9f",
  "password": "newSecurePassword123"
}
```

**Response:**

```json
{
  "message": "Password reset successfully"
}
```

---

## 🔄 Password Reset Flow

```mermaid
graph TD
    A["User clicks Forgot Password?"] --> B[/forgot-password]
    B --> C[Enter Email + Captcha]
    C --> D[POST /api/auth/forgot-password]
    D --> E[Generate Reset Token]
    E --> F[Send Email with Reset Link]
    F --> G[User Checks Email]
    G --> H[Click Reset Link]
    H --> I[/reset-password?token=xxx]
    I --> J[Validate Token via API]
    J --> K{Token Valid?}
    K -->|Valid| L[Show Reset Form]
    K -->|Invalid/Expired| M[Show Error Page]
    L --> N[Enter New Password]
    N --> O[POST /api/auth/reset-password]
    O --> P[Update Password]
    P --> Q[Clear Reset Token]
    Q --> R[Redirect to Login]
```

**Password Reset Process**:

1. **Request Reset**: User enters email on `/forgot-password` page
2. **Token Generation**: Backend generates secure token (SHA256 hashed)
3. **Email Sending**: Reset link sent to user's email
4. **Token Validation**: Frontend validates token on page load
5. **Password Reset**: User submits new password with token
6. **Security Cleanup**: Token cleared after successful reset

**Security Features**:

- **Token Expiry**: 10-minute auto-expiration
- **One-Time Use**: Token cleared after successful reset
- **Rate Limiting**: Prevents spam requests
- **Captcha Protection**: Cloudflare Turnstile verification
- **User Enumeration Protection**: Same response for existing/non-existing emails
- **Secure Hashing**: SHA256 for token storage

---

## 📧 Email Templates

### **Password Reset Email**

**Subject**: "Reset Your Password"

**Content**:
- Reset button with red styling (`#dc3545`)
- Reset link as fallback
- 10-minute expiry warning
- Security notice about unauthorized requests
- Professional footer with Task Management branding

### **Email Verification Email**

**Subject**: "Verify Your Email Address"

**Content**:
- Verification button with blue styling (`#007bff`)
- Verification link as fallback
- 10-minute expiry warning
- Instructions for email verification process

### **Welcome Email**

**Subject**: "Welcome to Task Management System"

**Content**:
- Personalized greeting with user's name
- Confirmation of successful verification
- Login button with green styling (`#28a745`)
- Professional welcome message

---

## 🗄️ Updated Database Schema

### **User Model (Updated)**

```typescript
interface User {
  id: string                    // UUID
  name: string
  email: string                 // Unique
  passwordHash?: string         // Optional for OAuth
  role: 'manager' | 'staff'
  isVerified: boolean           // Default: false
  verificationToken?: string    // Email verification token
  verificationTokenExpires?: DateTime  // Token expiry
  passwordResetToken?: string   // 🆕 Password reset token
  passwordResetExpires?: DateTime  // 🆕 Password reset token expiry
  managerId?: string           // Self-relation for manager-staff
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt?: DateTime         // Soft delete field
}
```

**New Fields Added**:
- `passwordResetToken`: Hashed token for password reset
- `passwordResetExpires`: Expiration time for reset token

---

## 🛠️ Implementation Files

### **Backend Password Reset Files**

```
backend/
├── src/
│   ├── controllers/
│   │   └── passwordReset.controller.ts    # 🆕 Password reset API controllers
│   ├── services/
│   │   └── passwordReset.service.ts      # 🆕 Password reset business logic
│   ├── utils/
│   │   ├── passwordResetToken.ts         # 🆕 Token generation & validation
│   │   └── emailService.ts              # 🔄 Updated with password reset email
│   └── routes/
│       └── auth.routes.ts               # 🔄 Updated with password reset routes
```

### **Frontend Password Reset Files**

```
fe-nextjs/
├── app/
│   ├── forgot-password/
│   │   └── page.tsx                    # 🆕 Forgot password request page
│   └── reset-password/
│       └── page.tsx                    # 🆕 Password reset form page
└── app/
    └── login/
        └── page.tsx                    # 🔄 Added "Forgot Password?" link
```

---

## 🔌 API Endpoints

### **Authentication Endpoints**

| Method | Endpoint                         | Auth          | Description                            |
| ------ | -------------------------------- | ------------- | -------------------------------------- |
| `POST` | `/api/auth/login`                | Public        | User login with Turnstile verification |
| `POST` | `/api/auth/logout`               | JWT Cookie    | Logout & clear cookie                  |
| `GET`  | `/api/auth/me`                   | JWT Cookie    | Get current authenticated user         |
| `POST` | `/api/auth/forgot-password`        | Public        | 🆕 Request password reset email      |
| `POST` | `/api/auth/validate-reset-token`   | Public        | 🆕 Validate password reset token     |
| `POST` | `/api/auth/reset-password`         | Public        | 🆕 Reset password with token         |
| `POST` | `/api/auth/manager/create/staff` | JWT (Manager) | Manager creates staff                  |
| `POST` | `/api/auth/verify/:userId`       | JWT           | Verify user email                      |

#### **Login Example**

**Request:**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "manager@example.com",
  "password": "password123",
  "turnstileToken": "cloudflare-turnstile-token"
}
```

**Response:**

```json
{
  "user": {
    "id": "cm123abc",
    "email": "manager@example.com",
    "name": "John Manager",
    "role": "manager",
    "isVerified": true,
    "managerId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Cookie Set:**

```
Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

---

### **Email Verification Endpoints**

| Method | Endpoint                              | Auth          | Description                            |
| ------ | ------------------------------------ | ------------- | -------------------------------------- |
| `POST` | `/api/verification/send-verification-email` | Public        | Send verification email to user         |
| `GET`  | `/api/verification/verify-email`           | Public        | Verify email with token (via email link) |

#### **Send Verification Email Example**

**Request:**

```bash
POST /api/verification/send-verification-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "Verification email sent successfully. Please check your inbox."
}
```

#### **Verify Email Example**

**Request:**

```bash
GET /api/verification/verify-email?token=1175067baa7d81d6d65aa499ace98b484cd23930cd7373c6167357b5dbc39f9f
```

**Response:**

```json
{
  "message": "Email verified successfully! You can now login.",
  "user": {
    "id": "cm123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "manager",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Frontend Verification Flow:**

1. User clicks email link → `http://localhost:3000/verify-email?token=xxx`
2. Frontend page calls backend API
3. Backend updates `isVerified: true` in database
4. Frontend redirects to login with success message

---

### **User Management Endpoints**

| Method | Endpoint                    | Auth          | Description                     |
| ------ | --------------------------- | ------------- | ------------------------------- |
| `GET`  | `/api/users/staff`          | JWT (Manager) | Get all staff under manager     |
| `GET`  | `/api/users/profile`        | JWT           | Get current user profile        |
| `PUT`  | `/api/users/profile`        | JWT           | Update current user profile     |
| `PUT`  | `/api/users/password`        | JWT           | Change user password            |
| `DELETE` | `/api/users/:id`          | JWT (Admin)   | Soft delete user (Admin only)   |

#### **Get Staff Example**

**Request:**

```bash
GET /api/users/staff
Cookie: token=jwt_token_here
```

**Response:**

```json
{
  "staff": [
    {
      "id": "cm456def",
      "name": "Jane Staff",
      "email": "jane@example.com",
      "role": "staff",
      "isVerified": true,
      "managerId": "cm123abc",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### **Task Management Endpoints**

| Method | Endpoint                    | Auth          | Description                     |
| ------ | --------------------------- | ------------- | ------------------------------- |
| `POST` | `/api/tasks`                | JWT (Manager) | Create new task                 |
| `GET`  | `/api/tasks`                | JWT (Manager) | Get all tasks for manager       |
| `GET`  | `/api/tasks/assigned`       | JWT (Staff)   | Get tasks assigned to staff     |
| `GET`  | `/api/tasks/:id`            | JWT           | Get specific task details       |
| `PUT`  | `/api/tasks/:id`            | JWT           | Update task                     |
| `PUT`  | `/api/tasks/:id/status`     | JWT           | Update task status              |
| `DELETE` | `/api/tasks/:id`          | JWT (Manager) | Soft delete task                |

#### **Create Task Example**

**Request:**

```bash
POST /api/tasks
Content-Type: application/json
Cookie: token=jwt_token_here

{
  "title": "Complete Project Documentation",
  "description": "Write comprehensive documentation for the new feature",
  "priority": "high",
  "deadline": "2024-01-15T23:59:59.000Z",
  "assignedToId": "cm456def"
}
```

**Response:**

```json
{
  "id": "task789ghi",
  "title": "Complete Project Documentation",
  "description": "Write comprehensive documentation for the new feature",
  "priority": "high",
  "status": "todo",
  "deadline": "2024-01-15T23:59:59.000Z",
  "completedAt": null,
  "completionNotes": null,
  "jobResult": [],
  "createdById": "cm123abc",
  "assignedToId": "cm456def",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### **Update Task Status Example**

**Request:**

```bash
PUT /api/tasks/task789ghi/status
Content-Type: application/json
Cookie: token=jwt_token_here

{
  "status": "in_progress",
  "completionNotes": "Started working on the documentation outline"
}
```

**Response:**

```json
{
  "id": "task789ghi",
  "status": "in_progress",
  "completionNotes": "Started working on the documentation outline",
  "updatedAt": "2024-01-02T10:30:00.000Z"
}
```

---

### **Admin Endpoints**

| Method | Endpoint                    | Auth               | Description                     |
| ------ | --------------------------- | ------------------ | ------------------------------- |
| `POST` | `/api/admin/manager`        | Admin Secret       | Create new manager              |
| `POST` | `/api/admin/staff`          | Admin Secret       | Create staff with manager       |
| `GET`  | `/api/admin/managers`       | Admin Secret       | Get all managers                |
| `GET`  | `/api/admin/users`          | Admin Secret       | Get all users (including deleted) |

#### **Admin Authentication**

Admin endpoints require `X-Admin-Secret` header:

```bash
POST /api/admin/manager
Content-Type: application/json
X-Admin-Secret: your_admin_secret_key

{
  "name": "New Manager",
  "email": "newmanager@example.com",
  "password": "securepassword123"
}
```

---

### **Comment Endpoints**

| Method | Endpoint                    | Auth          | Description                     |
| ------ | --------------------------- | ------------- | ------------------------------- |
| `POST` | `/api/tasks/:id/comments`   | JWT           | Add comment to task             |
| `GET`  | `/api/tasks/:id/comments`   | JWT           | Get task comments               |
| `PUT`  | `/api/comments/:id`         | JWT           | Update comment                  |
| `DELETE` | `/api/comments/:id`       | JWT           | Soft delete comment             |

---

## 🔒 Security Features

### **Authentication & Authorization**

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: 7-day expiration, httpOnly cookies
- **Role-Based Access Control**: Admin, Manager, Staff roles
- **Email Verification**: Required for account activation with token-based verification
- **Verification Tokens**: Secure hashed tokens with expiration time
- **Admin Secret Key**: Separate authentication for admin operations
- **Protected Routes**: Middleware-based route protection with verification checks

### **Input Validation & Sanitization**

- **Zod Schemas**: Comprehensive input validation
- **Email Format**: RFC 5322 compliant validation
- **Password Strength**: Minimum 8 characters
- **XSS Prevention**: Input sanitization
- **SQL Injection Prevention**: Prisma ORM parameterized queries

### **Rate Limiting & Protection**

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Captcha Protection**: Cloudflare Turnstile on login
- **CORS**: Configured for specific origins
- **Cookie Security**: HttpOnly, Secure, SameSite settings

### **Soft Delete Security**

- **Data Recovery**: Deleted data can be restored
- **Audit Trail**: All actions logged in ActivityLog
- **Integrity**: Foreign key constraints maintained
- **Privacy**: Deleted data filtered from normal queries

---
