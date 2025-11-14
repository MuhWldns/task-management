# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication Endpoints

### Login

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "id": "user-uuid",
  "name": "User Name",
  "email": "user@example.com",
  "role": "manager|staff",
  "isVerified": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Notes:**

- JWT token is set in HTTP-only cookie
- Returns 401 for invalid credentials
- Returns 401 if email is not verified

### Create Staff (Manager Only)

```http
POST /auth/create-staff
```

**Request Body:**

```json
{
  "name": "Staff Name",
  "email": "staff@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "id": "user-uuid",
  "name": "Staff Name",
  "email": "staff@example.com",
  "role": "staff",
  "isVerified": false,
  "managerId": "manager-uuid",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Notes:**

- Requires manager authentication
- Verification link will be printed to console
- Returns 403 if requester is not a manager

### Verify Email

```http
POST /auth/verify-email/:userId
```

**Response:**

```json
{
  "message": "Email verified successfully"
}
```

### Logout

```http
POST /auth/logout
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Notes:**

- Clears the JWT cookie

## Test Accounts

### Manager

- Email: manager@example.com
- Password: manager123
- Status: Verified

### Staff 1

- Email: alice@example.com
- Password: staff123
- Status: Verified

### Staff 2

- Email: bob@example.com
- Password: staff123
- Status: Verified

### Unverified Staff

- Email: carol@example.com
- Password: staff123
- Status: Unverified

## Test Data

### Tasks

1. **Implement Login Page**

   - Assigned to: Alice Staff
   - Priority: High
   - Status: In Progress
   - Deadline: 7 days from seeding
   - Has 2 comments and 1 activity log

2. **Design Database Schema**
   - Assigned to: Bob Staff
   - Priority: Medium
   - Status: Pending Review
   - Deadline: 3 days from seeding
   - Has 1 activity log
