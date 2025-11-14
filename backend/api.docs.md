# Task Management API Documentation

## Authentication API Endpoints

### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "USER | ADMIN | MANAGER",
    "isVerified": boolean,
    "managerId": "string | null"
  },
  "token": "string"
}
```

**Error Responses:**

- `401` - Invalid credentials
- `403` - Email not verified

### Register

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "USER | ADMIN | MANAGER",
  "managerId": "string?" // Optional
}
```

**Validation Rules:**

- `name`: 2-50 characters
- `email`: Valid email format
- `password`: Minimum 8 characters
- `role`: Must be one of: USER, ADMIN, MANAGER

**Response:**

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "USER | ADMIN | MANAGER",
  "isVerified": false,
  "managerId": "string | null"
}
```

**Error Responses:**

- `400` - Validation error
- `409` - Email already registered

### Email Verification

```http
POST /api/auth/verify-email/:userId
```

**Parameters:**

- `userId`: User ID to verify

**Response:**

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "USER | ADMIN | MANAGER",
  "isVerified": true,
  "managerId": "string | null"
}
```

**Error Responses:**

- `404` - User not found
- `400` - Invalid verification request

## Security Features

### Authentication

- Password hashing using bcrypt (10 rounds)
- JWT-based authentication with 24h expiration
- Email verification required
- Role-based access control (RBAC)

### Input Validation & Sanitization

- Email format validation
- Password strength requirements
- Input sanitization for XSS prevention
- Request payload validation

### Rate Limiting

- Maximum 100 requests per 15 minutes per IP
- Applies to all authentication endpoints

### Additional Security Measures

- CORS enabled with specific origins
- Cookie security settings
- Request size limits
- Error handling without sensitive data exposure

## Environment Setup

Required environment variables:

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key
DATABASE_URL=your_database_connection_string
```

## API Usage Notes

1. All requests must include:
   - Header: `Content-Type: application/json`
   - Credentials: `include`

2. Authentication Flow:
   - Register account
   - Verify email through link
   - Login to receive JWT token
   - Include token in subsequent requests

3. Error Handling:
   - All errors return JSON responses
   - Include appropriate HTTP status codes
   - Validation errors include specific messages
