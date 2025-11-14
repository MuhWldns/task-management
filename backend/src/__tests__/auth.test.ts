import request from "supertest";
import { app } from "../index";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Authentication Endpoints", () => {
  const testManager = {
    email: "manager@test.com",
    password: "Test123!",
    name: "Test Manager",
    phone: "+6281234567890",
  };

  const testStaff = {
    email: "staff@test.com",
    password: "Test123!",
    name: "Test Staff",
    phone: "+6281234567891",
  };

  describe("POST /api/auth/create/manager", () => {
    it("should create a new manager", async () => {
      const res = await request(app).post("/api/auth/create/manager").send(testManager);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.email).toBe(testManager.email);
      expect(res.body.role).toBe("manager");
      expect(res.body).not.toHaveProperty("passwordHash");
    });

    it("should return 400 for duplicate email", async () => {
      // Create first manager
      await request(app).post("/api/auth/create/manager").send(testManager);

      // Try to create another manager with same email
      const res = await request(app).post("/api/auth/create/manager").send(testManager);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should validate required fields", async () => {
      const res = await request(app).post("/api/auth/create/manager").send({
        email: "invalid",
        name: "Test",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/login", () => {
    let userId: string;

    beforeEach(async () => {
      // Create a test manager
      const createRes = await request(app).post("/api/auth/create/manager").send(testManager);
      userId = createRes.body.id;

      // Verify the email first
      await request(app).post(`/api/auth/verify/${userId}`).send();
    });

    it("should login successfully with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testManager.email,
        password: testManager.password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body.email).toBe(testManager.email);
      expect(res.body.role).toBe("manager");
      expect(res.body).not.toHaveProperty("passwordHash");
      // Check if cookie header exists and contains a token
      const cookieHeader = res.headers["set-cookie"]?.[0];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toMatch(/token=.+/);
    });

    it("should fail with incorrect password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testManager.email,
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("should fail with non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@test.com",
        password: testManager.password,
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/create/staff", () => {
    let managerToken: string;

    beforeEach(async () => {
      // Create and login as manager
      const createRes = await request(app).post("/api/auth/create/manager").send(testManager);

      // Verify the manager's email
      await request(app).post(`/api/auth/verify/${createRes.body.id}`).send();

      // Login as manager
      const loginRes = await request(app).post("/api/auth/login").send({
        email: testManager.email,
        password: testManager.password,
      });

      // Extract just the token value from the cookie
      const cookieHeader = loginRes.headers["set-cookie"]?.[0];
      const tokenMatch = cookieHeader?.match(/token=([^;]+)/);
      managerToken = tokenMatch ? `token=${tokenMatch[1]}` : "";
    });

    it("should create staff when requested by manager", async () => {
      const res = await request(app).post("/api/auth/create/staff").set("Cookie", managerToken).send(testStaff);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.email).toBe(testStaff.email);
      expect(res.body.role).toBe("staff");
      expect(res.body).toHaveProperty("managerId");
      expect(res.body).not.toHaveProperty("passwordHash");
    });

    it("should fail when not authenticated", async () => {
      const res = await request(app).post("/api/auth/create/staff").send(testStaff);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("should fail when authenticated as staff", async () => {
      // Create staff
      const createStaffRes = await request(app).post("/api/auth/create/staff").set("Cookie", managerToken).send(testStaff);

      // Verify staff email
      await request(app).post(`/api/auth/verify/${createStaffRes.body.id}`).send();

      // Login as staff
      const staffLoginRes = await request(app).post("/api/auth/login").send({
        email: testStaff.email,
        password: testStaff.password,
      });

      // Extract just the token value from the cookie
      const staffCookieHeader = staffLoginRes.headers["set-cookie"]?.[0];
      const staffTokenMatch = staffCookieHeader?.match(/token=([^;]+)/);
      const staffToken = staffTokenMatch ? `token=${staffTokenMatch[1]}` : "";

      // Try to create another staff
      const res = await request(app)
        .post("/api/auth/create/staff")
        .set("Cookie", staffToken)
        .send({
          ...testStaff,
          email: "another@staff.com",
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/verify/:userId", () => {
    let userId: string;

    beforeEach(async () => {
      // Create an unverified user
      const createRes = await request(app).post("/api/auth/create/manager").send(testManager);

      userId = createRes.body.id;
    });

    it("should verify email successfully", async () => {
      const res = await request(app).post(`/api/auth/verify/${userId}`).send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");

      // Check if user is verified
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user?.isVerified).toBe(true);
    });

    it("should fail with invalid user ID", async () => {
      const res = await request(app).post("/api/auth/verify/invalid-id").send();

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear the token cookie", async () => {
      const res = await request(app).post("/api/auth/logout").send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.headers["set-cookie"][0]).toMatch(/token=;/);
    });
  });
});
