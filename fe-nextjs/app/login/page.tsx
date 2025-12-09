"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lock, Mail, Eye, EyeOff, UserCircle, Shield, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"staff" | "manager">("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [showVerificationButton, setShowVerificationButton] = useState(false);
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleSendVerificationEmail = async () => {
    if (!lastAttemptedEmail) {
      toast.error("Please enter your email address first");
      return;
    }

    setIsSendingVerification(true);
    try {
      console.log("Sending verification email to:", lastAttemptedEmail);

      const response = await fetch("http://localhost:3007/api/verification/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: lastAttemptedEmail }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        toast.success(data.message || "Verification email sent successfully!");
      } else {
        toast.error(data.error || "Failed to send verification email");
      }
    } catch (error) {
      console.error("Send verification email error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!turnstileToken) {
      toast.error("Please complete the captcha verification");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3007/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          turnstileToken,
        }),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        // ✅ Show error tanpa remount Turnstile
        const errorMessage = typeof data.error === 'string' ? data.error : data.error?.message || "Login failed";

        // Check if error is about email not verified
        if (errorMessage && errorMessage.includes("Email not verified")) {
          setLastAttemptedEmail(email);
          setShowVerificationButton(true);
          toast.error(errorMessage || "Email not verified. Please check your inbox.");
        } else {
          toast.error(errorMessage);
        }

        setIsLoading(false);
        return;
      }

      if (data.user.role !== role) {
        toast.error(`This account is not a ${role}. Please select the correct role.`);
        setIsLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Login successful!");

      // Check if user is verified
      if (!data.user.isVerified) {
        router.push("/please-verify");
        return;
      }

      // Normal redirect for verified users
      if (data.user.role === "manager") {
        router.push("/manager");
      } else {
        router.push("/staff");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Login as</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as "staff" | "manager")} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="staff" id="staff" className="peer sr-only" />
                  <Label
                    htmlFor="staff"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                  >
                    <UserCircle className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Staff</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="manager" id="manager" className="peer sr-only" />
                  <Label
                    htmlFor="manager"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:bg-purple-50 cursor-pointer transition-all"
                  >
                    <Shield className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Manager</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => {
                  setTurnstileToken("");
                  toast.error("Captcha verification failed");
                }}
                onExpire={() => {
                  setTurnstileToken("");
                  toast.error("Captcha expired. Please verify again.");
                }}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !turnstileToken}>
              {isLoading ? (
                <>
                  <span className="mr-2">Signing in...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot your password?
              </Link>
            </div>

            {/* Email Verification Button - Only show when email is not verified */}
            {showVerificationButton && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 font-medium">
                      Email not verified
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Check your inbox or resend verification email
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendVerificationEmail}
                    disabled={isSendingVerification}
                    className="ml-3 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    {isSendingVerification ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border border-yellow-700 border-t-transparent mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MailOpen className="h-3 w-3 mr-2" />
                        Resend
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
