"use client";

import { useState, useEffect } from "react";
import SecretKeyForm from "./SecretKeyForm";
import AdminPanel from "./AdminPanel";
import { toast } from "sonner";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verifiedSecretKey, setVerifiedSecretKey] = useState("");

  // ✅ Check sessionStorage saat mount
  useEffect(() => {
    const savedKey = sessionStorage.getItem("adminSecretKey");
    if (savedKey) {
      setVerifiedSecretKey(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const handleVerified = (secretKey: string) => {
    sessionStorage.setItem("adminSecretKey", secretKey); // ✅ Save to sessionStorage
    setVerifiedSecretKey(secretKey);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminSecretKey"); // ✅ Clear sessionStorage
    setIsAuthenticated(false);
    setVerifiedSecretKey("");
    toast.info("Logged out from admin panel");
  };

  if (!isAuthenticated) {
    return <SecretKeyForm onVerified={handleVerified} />;
  }

  return <AdminPanel secretKey={verifiedSecretKey} onLogout={handleLogout} />;
}
