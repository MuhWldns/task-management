"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { Lock, Shield } from "lucide-react";
import { toast } from "sonner";

interface SecretKeyFormProps {
  onVerified: (secretKey: string) => void;
}

export default function SecretKeyForm({ onVerified }: SecretKeyFormProps) {
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifySecretKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      // Verify secret key by attempting to fetch managers
      const response = await fetch("http://localhost:3007/api/admin/managers", {
        headers: {
          "X-Admin-Secret": secretKeyInput,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid admin secret key");
      }

      onVerified(secretKeyInput);
      toast.success("Access granted!");
    } catch (error: any) {
      toast.error(error.message || "Invalid secret key");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">Admin Access Required</CardTitle>
          <CardDescription>Enter the admin secret key to access the panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifySecretKey} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret-key">Admin Secret Key</Label>
              <Input id="secret-key" type="password" placeholder="Enter secret key" value={secretKeyInput} onChange={(e) => setSecretKeyInput(e.target.value)} required autoFocus />
            </div>

            <Button type="submit" className="w-full" disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <span className="mr-2">Verifying...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Access
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
