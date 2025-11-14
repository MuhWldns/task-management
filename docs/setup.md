# Development Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 16
- pnpm (for package management)

## Environment Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd task-management
```

2. Install dependencies:

```bash
# Install backend dependencies
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

3. Set up environment variables:
   Create `.env` file in the `backend` directory:

```env
PORT=3000
DATABASE_URL="postgresql://admin:admin123@localhost:5432/ticketing_db"
JWT_SECRET=your-super-secret-key-here
FRONTEND_URL=http://localhost:5173
```

4. Start PostgreSQL using Docker:

```bash
docker-compose up -d
```

5. Initialize the database:

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

## Running the Application

### Backend

```bash
cd backend
pnpm run dev
```

Server will run on http://localhost:3000

### Frontend

```bash
cd frontend
pnpm run dev
```

Frontend will run on http://localhost:5173

## Test Data

The seed script creates the following test accounts:

### Manager Account

- Email: manager@example.com
- Password: manager123
- Can create staff accounts
- Can create and assign tasks
- Can approve/reject task submissions

### Staff Accounts

1. Alice (Verified)

   - Email: alice@example.com
   - Password: staff123
   - Has an in-progress task

2. Bob (Verified)

   - Email: bob@example.com
   - Password: staff123
   - Has a task pending review

3. Carol (Unverified)
   - Email: carol@example.com
   - Password: staff123
   - Cannot login until verified

## Database Seeding

To reset and reseed the database:

```bash
cd backend
npx prisma db reset
```

This will:

1. Drop all tables
2. Run migrations
3. Execute the seed script

## Development Tools

### Prisma Studio

To view/edit database content:

```bash
cd backend
npx prisma studio
```

Access at http://localhost:5555
