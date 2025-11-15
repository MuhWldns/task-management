"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, Users, Eye, EyeOff, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Manager {
  id: string;
  name: string;
  email: string;
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

  useEffect(() => {
    fetchManagers();
  }, []);

  // ...existing code...

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
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Create Manager
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Create Staff
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
        </Tabs>
      </div>
    </div>
  );
}
