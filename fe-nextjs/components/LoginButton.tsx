"use client";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";

export function LoginButton() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <Button variant="default" size="default" onClick={handleLogin}>
      <LogIn className="h-4 w-4 mr-2" />
      Sign In
    </Button>
  );
}
