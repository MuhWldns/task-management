"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, CheckSquare, LogOut, User, Plus, Clock, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [showCreateStaff, setShowCreateStaff] = useState(false);

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
      const [staffResponse, tasksResponse] = await Promise.all([
        fetch("http://localhost:3007/api/users/staff", {
          credentials: "include",
        }),
        fetch("http://localhost:3007/api/tasks", {
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <TrendingUp className="h-4 w-4" />
                Completed
              </CardDescription>
              <CardTitle className="text-3xl">{tasks.filter((t) => t.status === "completed").length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staff Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Staff Members</h3>
              <Button onClick={() => setShowCreateStaff(!showCreateStaff)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </div>

            {showCreateStaff && (
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
            )}

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
    </div>
  );
}
