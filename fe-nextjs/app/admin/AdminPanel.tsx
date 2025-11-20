"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, Users, Eye, EyeOff, LogOut, Edit, Trash2, UserCog, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  managerId: string;
  createdAt: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  managerId?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  staff?: Staff[];
  createdAt: string;
}

interface AdminPanelProps {
  secretKey: string;
  onLogout: () => void;
}

export default function AdminPanel({ secretKey, onLogout }: AdminPanelProps) {
  // Manager form state
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [showManagerPassword, setShowManagerPassword] = useState(false);
  const [isCreatingManager, setIsCreatingManager] = useState(false);

  // Staff form state
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  // Managers list
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [newRole, setNewRole] = useState<"manager" | "staff">("staff");
  const [newManagerId, setNewManagerId] = useState("");

  useEffect(() => {
    fetchManagers();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("http://localhost:3007/api/admin/users", {
        headers: {
          "X-Admin-Secret": secretKey,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchManagers = async () => {
    setIsLoadingManagers(true);
    try {
      const response = await fetch("http://localhost:3007/api/admin/managers", {
        // ✅ Fix
        headers: {
          "X-Admin-Secret": secretKey,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setManagers(data.managers || []);
      } else {
        toast.error("Failed to load managers");
      }
    } catch (error) {
      console.error("Failed to fetch managers:", error);
      toast.error("Failed to load managers");
    } finally {
      setIsLoadingManagers(false);
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingManager(true);

    try {
      const response = await fetch("http://localhost:3007/api/admin/managers", {
        // ✅ Fix endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": secretKey, // ✅ Fix - kirim di header
        },
        body: JSON.stringify({
          // ✅ Fix - hapus secretKey dari body
          name: managerName,
          email: managerEmail,
          password: managerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create manager");
      }

      toast.success(`Manager ${data.name} created successfully!`);

      // Reset form
      setManagerName("");
      setManagerEmail("");
      setManagerPassword("");

      // Refresh managers list
      fetchManagers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create manager");
    } finally {
      setIsCreatingManager(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingStaff(true);

    try {
      if (!selectedManagerId) {
        throw new Error("Please select a manager");
      }

      const response = await fetch("http://localhost:3007/api/admin/staff", {
        // ✅ Fix endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": secretKey, // ✅ Fix - kirim di header
        },
        body: JSON.stringify({
          // ✅ Fix - hapus secretKey dari body
          name: staffName,
          email: staffEmail,
          password: staffPassword,
          managerId: selectedManagerId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create staff");
      }

      toast.success(`Staff ${data.name} created successfully!`);

      // Reset form
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setSelectedManagerId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create staff");
    } finally {
      setIsCreatingStaff(false);
    }
  };

  // UI Functions for User Management
  const toggleManagerExpansion = (managerId: string) => {
    const newExpanded = new Set(expandedManagers);
    if (newExpanded.has(managerId)) {
      newExpanded.delete(managerId);
    } else {
      newExpanded.add(managerId);
    }
    setExpandedManagers(newExpanded);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role === "admin" ? "manager" : user.role);
    setNewManagerId(user.managerId || "");
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setNewRole("staff");
    setNewManagerId("");
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingUser(null);
  };

  const handleEditRole = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:3007/api/admin/users/${editingUser.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": secretKey,
        },
        body: JSON.stringify({
          role: newRole,
          managerId: newRole === "staff" ? newManagerId : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user role");
      }

      toast.success("User role updated successfully!");
      closeEditModal();
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const response = await fetch(`http://localhost:3007/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Secret": secretKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      toast.success("User deleted successfully!");
      closeDeleteModal();
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  // ...existing code...

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Create managers and staff members</p>
          </div>
          <Button variant="outline" onClick={onLogout} className="absolute top-6 right-6">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="manager" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Create Manager
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Create Staff
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          {/* Create Manager Tab */}
          <TabsContent value="manager">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Create New Manager
                </CardTitle>
                <CardDescription>Add a new manager to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateManager} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager-name">Full Name *</Label>
                    <Input id="manager-name" type="text" placeholder="John Doe" value={managerName} onChange={(e) => setManagerName(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager-email">Email *</Label>
                    <Input id="manager-email" type="email" placeholder="john@example.com" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager-password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="manager-password"
                        type={showManagerPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={managerPassword}
                        onChange={(e) => setManagerPassword(e.target.value)}
                        className="pr-10"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowManagerPassword(!showManagerPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                        {showManagerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isCreatingManager}>
                    {isCreatingManager ? (
                      <>
                        <span className="mr-2">Creating...</span>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Manager
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Staff Tab */}
          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Create New Staff
                </CardTitle>
                <CardDescription>Add a new staff member and assign to a manager</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStaff} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-name">Full Name *</Label>
                    <Input id="staff-name" type="text" placeholder="Jane Smith" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Email *</Label>
                    <Input id="staff-email" type="email" placeholder="jane@example.com" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="staff-password"
                        type={showStaffPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        className="pr-10"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowStaffPassword(!showStaffPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                        {showStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager-select">Assign to Manager *</Label>
                    <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                      <SelectTrigger id="manager-select">
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingManagers ? (
                          <SelectItem value="loading" disabled>
                            Loading managers...
                          </SelectItem>
                        ) : managers.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No managers available
                          </SelectItem>
                        ) : (
                          managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name} ({manager.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={isCreatingStaff || managers.length === 0}>
                    {isCreatingStaff ? (
                      <>
                        <span className="mr-2">Creating...</span>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Staff
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>View and manage all users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span className="ml-2">Loading users...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Managers Section */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Managers</h3>
                      {users
                        .filter((u) => u.role === "manager")
                        .map((manager) => (
                          <div key={manager.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button onClick={() => toggleManagerExpansion(manager.id)} className="p-1 hover:bg-gray-200 rounded">
                                  {expandedManagers.has(manager.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                                <div>
                                  <p className="font-medium">{manager.name}</p>
                                  <p className="text-sm text-gray-600">{manager.email}</p>
                                  <p className="text-xs text-blue-600">Manager</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditModal(manager)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openDeleteModal(manager)} className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Staff under this manager */}
                            {expandedManagers.has(manager.id) && (
                              <div className="mt-4 ml-8 space-y-2">
                                <p className="text-sm font-medium text-gray-700">Staff Members:</p>
                                {manager.staff && manager.staff.length > 0 ? (
                                  manager.staff.map((staff) => (
                                      <div key={staff.id} className="border rounded p-3 bg-white">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="font-medium">{staff.name}</p>
                                            <p className="text-sm text-gray-600">{staff.email}</p>
                                            <p className="text-xs text-green-600">Staff</p>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEditModal(staff)}>
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => openDeleteModal(staff)} className="text-red-600 hover:text-red-700">
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No staff members assigned</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Unassigned Staff Section */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Unassigned Staff</h3>
                      {users.filter((u) => u.role === "staff" && !u.managerId).length > 0 ? (
                        users
                          .filter((u) => u.role === "staff" && !u.managerId)
                          .map((staff) => (
                            <div key={staff.id} className="border rounded-lg p-4 bg-yellow-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{staff.name}</p>
                                  <p className="text-sm text-gray-600">{staff.email}</p>
                                  <p className="text-xs text-orange-600">Staff (Unassigned)</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => openEditModal(staff)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => openDeleteModal(staff)} className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No unassigned staff members</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Role Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 shadow-2xl">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User Role</CardTitle>
              <CardDescription>Change role and assignment for {editingUser.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>User Info</Label>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">{editingUser.name}</p>
                  <p className="text-sm text-gray-600">{editingUser.email}</p>
                  <p className="text-xs text-gray-500">Current role: {editingUser.role}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-role">New Role</Label>
                <Select value={newRole} onValueChange={(value: "manager" | "staff") => setNewRole(value)}>
                  <SelectTrigger id="new-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newRole === "staff" && (
                <div className="space-y-2">
                  <Label htmlFor="assign-manager">Assign to Manager</Label>
                  <Select value={newManagerId} onValueChange={setNewManagerId}>
                    <SelectTrigger id="assign-manager">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} ({manager.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={closeEditModal} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleEditRole} className="flex-1">
                  Update Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 shadow-2xl">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete User</CardTitle>
              <CardDescription>Are you sure you want to delete this user?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-red-50 rounded border border-red-200">
                <p className="font-medium">{deletingUser.name}</p>
                <p className="text-sm text-gray-600">{deletingUser.email}</p>
                <p className="text-xs text-gray-500">Role: {deletingUser.role}</p>
              </div>

              <p className="text-sm text-red-600">
                <strong>Warning:</strong> This action cannot be undone. All data associated with this user will be permanently deleted.
              </p>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={closeDeleteModal} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteUser} className="flex-1">
                  Delete User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
