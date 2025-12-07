import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes"; // ✅ Import admin routes
import verificationRoutes from "./routes/verification.routes"; // ✅ Import verification routes

const app = express();
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

export { app };
app.use(globalLimiter);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (_req, res) => {
  return res.json({
    status: 200,
    message: "Service Is Ready",
  });
});

// API Routes
app.use("/api/admin", adminRoutes); // ✅ Fix: kasih adminRoutes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/verification", verificationRoutes); // ✅ Add verification routes

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error Handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
