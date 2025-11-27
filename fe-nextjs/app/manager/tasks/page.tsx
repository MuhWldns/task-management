"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, LogOut, User, Plus, ArrowLeft, Calendar, AlertCircle, Clock, CheckCircle2, Filter, Search, Eye, ExternalLink, X } from "lucide-react";
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
  assignedTo: Staff;
  createdAt: string;
}

export default function TaskManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

      if (data.user.role !== "manager") {
        toast.error("Access denied. Manager only.");
        router.push("/staff");
        return;
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));

      fetchData();
    } catch (error) {
      console.error("Access verification failed:", error);
      toast.error("Session expired. Please login again.");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  const fetchData = async () => {
    try {
      const staffResponse = await fetch("http://localhost:3007/api/users/staff", {
        credentials: "include",
      });
      const staffData = await staffResponse.json();
      setStaffList(staffData.staff || []); // ✅ Set staff list

      const tasksResponse = await fetch("http://localhost:3007/api/tasks", {
        credentials: "include",
      });
      const tasksData = await tasksResponse.json();
      setTasks(tasksData.tasks || []); // ✅ Set tasks with completionNotes and jobResult

      // ❌ HAPUS 2 LINE INI!
      // setStaffList([]);
      // setTasks([]);

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch("http://localhost:3007/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          dueDate: taskDueDate,
          assignedToId: assignedStaffId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      toast.success("Task created successfully!");

      // Reset form
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setTaskDueDate("");
      setAssignedStaffId("");
      setShowCreateForm(false);

      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle view task details
  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchStatus = filterStatus === "all" || task.status === filterStatus;
    const matchPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchPriority && matchSearch;
  });

  // Task statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linar-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/manager")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="rounded-full bg-blue-100 p-2">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
                <p className="text-sm text-gray-500">Create and assign tasks to your team</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{taskStats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600">{taskStats.inProgress}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{taskStats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
            <p className="text-gray-600">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Tasks</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="search" placeholder="Search by title or description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterStatus">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterPriority">Filter by Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Task Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>Assign a new task to your team member</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taskTitle">Task Title *</Label>
                  <Input id="taskTitle" placeholder="e.g., Develop login feature" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskDescription">Description *</Label>
                  <Textarea id="taskDescription" placeholder="Describe the task in detail..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} required rows={4} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskPriority">Priority *</Label>
                    <Select value={taskPriority} onValueChange={(value: "low" | "medium" | "high") => setTaskPriority(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taskDueDate">Due Date *</Label>
                    <Input id="taskDueDate" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedStaff">Assign To *</Label>
                    <Select value={assignedStaffId} onValueChange={setAssignedStaffId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating || staffList.length === 0}>
                    {isCreating ? "Creating..." : "Create Task"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setTaskTitle("");
                      setTaskDescription("");
                      setTaskPriority("medium");
                      setTaskDueDate("");
                      setAssignedStaffId("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                {staffList.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">No staff available</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Please add staff members first before creating tasks.{" "}
                          <button type="button" onClick={() => router.push("/manager/staff")} className="underline font-medium hover:text-yellow-900">
                            Go to Staff Management
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{tasks.length === 0 ? "No tasks yet" : "No tasks found"}</h3>
              <p className="text-gray-500 mb-6">{tasks.length === 0 ? "Create your first task to get started" : "Try adjusting your filters or search query"}</p>
              {tasks.length === 0 && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{task.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{task.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority.toUpperCase()}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className={`capitalize flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status.replace("_", " ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {task.assignedTo.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(task)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                <p className="text-sm text-gray-500 mt-1">View task information and progress</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Task Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Task Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Title</p>
                    <p className="text-gray-900">{selectedTask.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-gray-900">{selectedTask.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Priority</p>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          selectedTask.priority === "high" ? "bg-red-100 text-red-800" : selectedTask.priority === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedTask.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          selectedTask.status === "pending" ? "bg-yellow-100 text-yellow-800" : selectedTask.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedTask.status === "pending" ? "Pending" : selectedTask.status === "in_progress" ? "In Progress" : "Completed"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Due Date</p>
                      <p className="text-gray-900">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Created</p>
                      <p className="text-gray-900">{new Date(selectedTask.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Assigned To</p>
                      <p className="text-gray-900">{selectedTask.assignedTo.name}</p>
                      <p className="text-sm text-gray-500">{selectedTask.assignedTo.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Completed At</p>
                      <p className="text-gray-900">{selectedTask.completedAt ? new Date(selectedTask.completedAt).toLocaleDateString() : "Not completed"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Notes */}
              {selectedTask.completionNotes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Staff Completion Notes</h4>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">{selectedTask.completionNotes}</p>
                  </div>
                </div>
              )}

              {/* Job Result Links */}
              {selectedTask.jobResult && selectedTask.jobResult.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Job Result Links</h4>
                  <div className="space-y-2">
                    {selectedTask.jobResult.map((link, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex-1"
                        >
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowDetailModal(false)} className="flex-1">
                Close
              </Button>
              {selectedTask.status === "pending" && (
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Edit Task
                </Button>
              )}
              {selectedTask.status === "in_progress" && (
                <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                  Send Reminder
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
