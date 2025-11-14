import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, afterEach } from "@jest/globals";

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database and run migrations
  await prisma.$connect();
});

afterEach(async () => {
  // Clean up database after each test
  const tables = ["User", "Task", "Comment"];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
});

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Mock environment variables
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";
