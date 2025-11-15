"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, LogOut, User, Clock, AlertCircle, CheckCircle2, Calendar, X } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  completionNotes?: string;
  createdAt: string;
}

export default function StaffPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  useEffect(() => {
    verifyAccess();
  }, []);

  const verifyAccess = async () => {
    try {
      const response = await fetch("http://localhost:3007/api/auth/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unauthorized");
      }

      const data = await response.json();

      if (data.user.role !== "staff") {
        toast.error("Access denied. Staff only.");
        router.push("/manager");
        return;
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      await fetchTasks();
      setIsLoading(false);
    } catch (error) {
      console.error("Access verification failed:", error);
      toast.error("Session expired. Please login again.");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch("http://localhost:3007/api/tasks/my-tasks", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  // ✅ DUMMY: Start Task (No API call)
  const handleStartTask = (taskId: string) => {
    console.log("🚀 DUMMY: Starting task", taskId);

    // Update local state only
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, status: "in_progress" as const } : task)));

    toast.success("Task started! Good luck! 🚀 (DUMMY)");
  };

  // ✅ DUMMY: Open modal
  const handleCompleteClick = (task: Task) => {
    setSelectedTask(task);
    setCompletionNotes("");
    setShowCompleteModal(true);
  };

  // ✅ DUMMY: Submit completion (No API call)
  const handleSubmitCompletion = () => {
    if (!selectedTask) return;

    if (!completionNotes.trim()) {
      toast.error("Please add completion notes");
      return;
    }

    if (completionNotes.trim().length < 10) {
      toast.error("Please write at least 10 characters");
      return;
    }

    // DUMMY: Console log only
    console.log("📝 DUMMY SUBMISSION:");
    console.log("Task ID:", selectedTask.id);
    console.log("Task Title:", selectedTask.title);
    console.log("Completion Notes:", completionNotes.trim());

    // Update local state only
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === selectedTask.id ? { ...task, status: "completed" as const, completionNotes: completionNotes.trim() } : task)));

    toast.success("✅ Task marked as complete! (DUMMY)");

    setShowCompleteModal(false);
    setSelectedTask(null);
    setCompletionNotes("");
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3007/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (dueDate: string, status: string) => {
    if (status === "completed") return "text-gray-500";

    const daysLeft = getDaysUntilDue(dueDate);
    if (daysLeft < 0) return "text-red-600 font-semibold";
    if (daysLeft <= 2) return "text-orange-600 font-semibold";
    return "text-gray-600";
  };

  const getDueDateText = (dueDate: string, status: string) => {
    if (status === "completed") return new Date(dueDate).toLocaleDateString();

    const daysLeft = getDaysUntilDue(dueDate);
    if (daysLeft < 0) return `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) > 1 ? "s" : ""}`;
    if (daysLeft === 0) return "Due today!";
    if (daysLeft === 1) return "Due tomorrow";
    if (daysLeft <= 7) return `${daysLeft} days left`;
    return new Date(dueDate).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
                <p className="text-sm text-gray-500">Staff Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}! 👋</h2>
          <p className="text-gray-600">Here are your assigned tasks</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Total Tasks
              </CardDescription>
              <CardTitle className="text-3xl">{tasks.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{pendingTasks.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                In Progress
              </CardDescription>
              <CardTitle className="text-3xl text-blue-600">{inProgressTasks.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Completed
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">{completedTasks.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tasks assigned yet</p>
              <p className="text-sm text-gray-400 mt-2">Your manager will assign tasks to you soon</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Tasks ({pendingTasks.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <span
                            className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                              task.priority === "high" ? "bg-red-100 text-red-800" : task.priority === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{task.description}</p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className={getDueDateColor(task.dueDate, task.status)}>{getDueDateText(task.dueDate, task.status)}</span>
                          </div>
                        </div>

                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleStartTask(task.id)}>
                          Start Task (DUMMY)
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Tasks */}
            {inProgressTasks.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  In Progress ({inProgressTasks.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inProgressTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <span
                            className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                              task.priority === "high" ? "bg-red-100 text-red-800" : task.priority === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{task.description}</p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className={getDueDateColor(task.dueDate, task.status)}>{getDueDateText(task.dueDate, task.status)}</span>
                          </div>
                        </div>

                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleCompleteClick(task)}>
                          Mark as Done
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Completed ({completedTasks.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500 opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg line-through text-gray-500">{task.title}</CardTitle>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 whitespace-nowrap">{task.priority}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-3">{task.description}</p>

                        {task.completionNotes && (
                          <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700 font-medium mb-1">Completion Notes:</p>
                            <p className="text-xs text-green-600 italic">"{task.completionNotes}"</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-medium">Completed ✓</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Complete Task</h3>
                <p className="text-sm text-gray-500 mt-1">What did you accomplish?</p>
              </div>
              <button onClick={() => setShowCompleteModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Task: <span className="text-blue-600">{selectedTask?.title}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completionNotes">
                  Completion Notes <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="completionNotes"
                  placeholder="Example: Completed the login page with email validation. Added forgot password feature. Tested on Chrome and Firefox..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">Minimum 10 characters • {completionNotes.length} characters</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowCompleteModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmitCompletion} disabled={completionNotes.trim().length < 10} className="flex-1 bg-green-600 hover:bg-green-700">
                Submit & Complete (DUMMY)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
