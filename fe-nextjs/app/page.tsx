"use client";

import { useRouter } from "next/navigation";
import { CheckSquare, Users, ArrowRight, LogIn } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50">
      <div className="text-center px-4 max-w-4xl">
        <h1 className="mb-6 text-5xl font-bold text-gray-900">Welcome to TaskFlow</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Professional task management system for teams. Choose your role to get started.</p>

        <button onClick={() => router.push("/login")} className="mb-12 inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <LogIn className="mr-2 h-5 w-5" />
          Sign In to Continue
        </button>

        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-8 hover:shadow-lg transition-all">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-blue-100 p-4">
                <CheckSquare className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-3">Staff Portal</h2>
            <p className="text-gray-600 mb-6">View and manage your assigned tasks</p>
            <button onClick={() => router.push("/staff")} className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Go to Staff Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>

          <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-8 hover:shadow-lg transition-all">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-blue-100 p-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-3">Manager Portal</h2>
            <p className="text-gray-600 mb-6">Manage staff and assign tasks</p>
            <button onClick={() => router.push("/manager")} className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Go to Manager Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
