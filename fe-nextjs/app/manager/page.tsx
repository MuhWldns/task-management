"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, CheckSquare, LogOut, User, Plus, Clock, AlertCircle, CheckCircle2, TrendingUp, X, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  completedAt?: string;
  completionNotes?: string;
  jobResult?: string[];
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingReviewTasks, setPendingReviewTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [showCreateStaff, setShowCreateStaff] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Create staff form
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    verifyAccess();
  }, []);

  // ✅ Verify access dengan /me endpoint
  const verifyAccess = async () => {
    try {
      const response = await fetch("http://localhost:3007/api/auth/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unauthorized");
      }

      const data = await response.json();

      // ✅ Check role dari backend
      if (data.user.role !== "manager") {
        toast.error("Access denied. Manager only.");
        router.push("/staff");
        return;
      }

      // ✅ Set user data
      setUser(data.user);

      // ✅ Sync localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Fetch data after verification
      await fetchData();

      setIsLoading(false);
    } catch (error) {
      console.error("Access verification failed:", error);
      toast.error("Session expired. Please login again.");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  // ✅ Fetch staff & tasks dari API
  const fetchData = async () => {
    setIsFetchingData(true);

    try {
      // Parallel fetch untuk performance
      const [staffResponse, tasksResponse, pendingReviewResponse] = await Promise.all([
        fetch("http://localhost:3007/api/users/staff", {
          credentials: "include",
        }),
        fetch("http://localhost:3007/api/tasks", {
          credentials: "include",
        }),
        fetch("http://localhost:3007/api/tasks/pending-review", {
          credentials: "include",
        }),
      ]);

      // ✅ Handle staff response
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setStaffList(staffData.staff || []);
      } else {
        console.error("Failed to fetch staff:", await staffResponse.text());
        toast.error("Failed to load staff list");
      }

      // ✅ Handle tasks response
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      } else {
        console.error("Failed to fetch tasks:", await tasksResponse.text());
        toast.error("Failed to load tasks");
      }

      // ✅ Handle pending review response
      if (pendingReviewResponse.ok) {
        const pendingReviewData = await pendingReviewResponse.json();
        setPendingReviewTasks(pendingReviewData.tasks || []);
      } else {
        console.error("Failed to fetch pending review tasks:", await pendingReviewResponse.text());
        // Don't show error toast for this as it might be empty
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data. Please refresh.");
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch("http://localhost:3007/api/auth/create/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create staff");
      }

      toast.success(`Staff ${data.user.name} created successfully!`);

      // ✅ 1. Optimistic update (instant)
      setStaffList((prev) => [
        {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isVerified: data.user.isVerified,
          createdAt: data.user.createdAt,
        },
        ...prev,
      ]);

      // ✅ 2. Reset form
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setShowCreateStaff(false);

      // ✅ 3. Background refresh (untuk sync tasks juga)
      setTimeout(() => {
        fetchData(); // Refresh semua data di background
      }, 100);
    } catch (error: any) {
      toast.error(error.message || "Failed to create staff");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle review task
  const handleReviewClick = (task: Task) => {
    setSelectedTask(task);
    setReviewAction(null);
    setReviewNotes("");
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedTask || !reviewAction) return;

    setIsReviewing(true);

    try {
      const response = await fetch(`http://localhost:3007/api/tasks/${selectedTask.id}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: reviewAction,
          reviewNotes: reviewNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to review task");
      }

      const data = await response.json();

      // Update local state - remove from pending review and update in tasks
      setPendingReviewTasks((prev) => prev.filter((task) => task.id !== selectedTask.id));
      setTasks((prev) => prev.map((task) => (task.id === selectedTask.id ? { ...task, status: data.task.status } : task)));

      toast.success(`Task ${reviewAction === "approve" ? "approved" : "rejected"} successfully!`);

      setShowReviewModal(false);
      setSelectedTask(null);
      setReviewAction(null);
      setReviewNotes("");
    } catch (error: any) {
      console.error("Failed to review task:", error);
      toast.error(error.message || "Failed to review task");
    } finally {
      setIsReviewing(false);
    }
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

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireVerification={true} allowedRoles={["manager"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
                <p className="text-sm text-gray-500">Manager Portal</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600">Manage your team and track progress from your dashboard</p>
        </div>

        {/* ✅ Show loading indicator while fetching */}
        {isFetchingData && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <p className="text-sm text-blue-700">Refreshing data...</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/manager/staff")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Management
              </CardTitle>
              <CardDescription>Add and manage your team members</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{staffList.length}</p>
              <p className="text-sm text-gray-500">Total Staff</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/manager/tasks")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Task Management
              </CardTitle>
              <CardDescription>Create and assign tasks to staff</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Staff
              </CardDescription>
              <CardTitle className="text-3xl">{staffList.length}</CardTitle>
            </CardHeader>
          </Card>

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
                <Clock className="h-4 w-4" />
                In Progress
              </CardDescription>
              <CardTitle className="text-3xl">{tasks.filter((t) => t.status === "in_progress").length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Pending Review
              </CardDescription>
              <CardTitle className="text-3xl text-orange-600">{pendingReviewTasks.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Completed
              </CardDescription>
              <CardTitle className="text-3xl">{tasks.filter((t) => t.status === "completed").length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Staff Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Staff Members</h3>
              {/* <Button onClick={() => setShowCreateStaff(!showCreateStaff)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button> */}
            </div>

            {/* {showCreateStaff && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New Staff</CardTitle>
                  <CardDescription>Add a new team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateStaff} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staffName">Name</Label>
                      <Input id="staffName" placeholder="Enter staff name" value={staffName} onChange={(e) => setStaffName(e.target.value)} required disabled={isCreating} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staffEmail">Email</Label>
                      <Input id="staffEmail" type="email" placeholder="Enter staff email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required disabled={isCreating} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staffPassword">Password</Label>
                      <Input
                        id="staffPassword"
                        type="password"
                        placeholder="Enter password (min 8 characters)"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={isCreating}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creating..." : "Create Staff"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreateStaff(false)} disabled={isCreating}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )} */}

            {staffList.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No staff members yet</p>
                  <p className="text-sm text-gray-400 mt-2">Click "Add Staff" to create your first team member</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {staffList.slice(0, 5).map((staff) => (
                  <Card key={staff.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{staff.name}</h4>
                          <p className="text-sm text-gray-500">{staff.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {staff.isVerified ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Verified</span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {staffList.length > 5 && (
                  <Button variant="outline" className="w-full" onClick={() => router.push("/manager/staff")}>
                    View All Staff ({staffList.length})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pending Review Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Pending Review</h3>
              {pendingReviewTasks.length > 0 && <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">{pendingReviewTasks.length} need review</span>}
            </div>

            {pendingReviewTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks pending review</p>
                  <p className="text-sm text-gray-400 mt-2">Staff will submit tasks for your review here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingReviewTasks.map((task) => (
                  <Card key={task.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <AlertCircle className="h-4 w-4 text-orange-500 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                            {task.assignedTo && <p className="text-xs text-gray-400 mt-2">Submitted by: {task.assignedTo.name}</p>}
                            {task.completedAt && <p className="text-xs text-gray-400 mt-1">Completed: {new Date(task.completedAt).toLocaleDateString()}</p>}
                            {task.completionNotes && (
                              <p className="text-xs text-gray-400 mt-1">
                                Notes: {task.completionNotes.substring(0, 50)}
                                {task.completionNotes.length > 50 ? "..." : ""}
                              </p>
                            )}
                            {task.jobResult && task.jobResult.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Results: {task.jobResult.length} link{task.jobResult.length > 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                              task.priority === "high" ? "bg-red-100 text-red-800" : task.priority === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                          <Button size="sm" onClick={() => handleReviewClick(task)}>
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Recent Tasks</h3>
              <Button variant="outline" onClick={() => router.push("/manager/tasks")}>
                View All
              </Button>
            </div>

            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks yet</p>
                  <p className="text-sm text-gray-400 mt-2">Create tasks to assign to your team</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <Card key={task.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {task.status === "pending" && <Clock className="h-4 w-4 text-yellow-500 mt-1" />}
                          {task.status === "in_progress" && <AlertCircle className="h-4 w-4 text-blue-500 mt-1" />}
                          {task.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                            {task.assignedTo && <p className="text-xs text-gray-400 mt-2">Assigned to: {task.assignedTo.name}</p>}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                            task.priority === "high" ? "bg-red-100 text-red-800" : task.priority === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {tasks.length > 5 && (
                  <Button variant="outline" className="w-full" onClick={() => router.push("/manager/tasks")}>
                    View All Tasks ({tasks.length})
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Review Task</h3>
                <p className="text-sm text-gray-500 mt-1">Approve or reject this task submission</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Task: <span className="text-blue-600">{selectedTask.title}</span>
                </p>
                {selectedTask.assignedTo && (
                  <p className="text-sm text-gray-600">
                    Submitted by: <span className="font-medium">{selectedTask.assignedTo.name}</span>
                  </p>
                )}
                {selectedTask.completedAt && (
                  <p className="text-sm text-gray-600">
                    Completed: <span className="font-medium">{new Date(selectedTask.completedAt).toLocaleDateString()}</span>
                  </p>
                )}
              </div>

              {/* Show completion notes if available */}
              {selectedTask.completionNotes && (
                <div className="space-y-2">
                  <Label>Staff Completion Notes</Label>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">{selectedTask.completionNotes}</p>
                  </div>
                </div>
              )}

              {/* Show job result links if available */}
              {selectedTask.jobResult && selectedTask.jobResult.length > 0 && (
                <div className="space-y-2">
                  <Label>Job Result Links</Label>
                  <div className="space-y-1">
                    {selectedTask.jobResult.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex-1 truncate">
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Review Action</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={reviewAction === "approve" ? "default" : "outline"}
                    className={`flex items-center gap-2 ${reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}`}
                    onClick={() => setReviewAction("approve")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant={reviewAction === "reject" ? "default" : "outline"}
                    className={`flex items-center gap-2 ${reviewAction === "reject" ? "bg-red-600 hover:bg-red-700" : ""}`}
                    onClick={() => setReviewAction("reject")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder={reviewAction === "approve" ? "Great work! Add any feedback or comments..." : "Please explain why this task is being rejected..."}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">{reviewNotes.length} characters</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowReviewModal(false)} className="flex-1" disabled={isReviewing}>
                Cancel
              </Button>
              <Button
                onClick={handleReviewSubmit}
                disabled={!reviewAction || isReviewing}
                className={`flex-1 ${reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {isReviewing ? "Processing..." : reviewAction === "approve" ? "Approve Task" : "Reject Task"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
