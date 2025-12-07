"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  requireVerification = true,
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication and verification status
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        
        if (!storedUser) {
          // Not logged in
          router.push("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Check role requirements
        if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
          router.push("/login");
          return;
        }

        // Check verification requirements
        if (requireVerification && !userData.isVerified) {
          router.push("/please-verify");
          return;
        }

      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requireVerification, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

// Hook for checking verification status
export function useVerificationCheck() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setIsVerified(data.user.isVerified);
          
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(data.user));
          
          // If user is now verified, redirect to appropriate page
          if (data.user.isVerified) {
            if (data.user.role === "manager") {
              router.push("/manager");
            } else {
              router.push("/staff");
            }
          }
        }
      } catch (error) {
        console.error("Verification check error:", error);
      }
    };

    checkVerification();
  }, [router]);

  return isVerified;
}