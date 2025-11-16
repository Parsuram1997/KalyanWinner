
'use client';

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { handleAdminLoginOrFirstTimeSetup } from "@/app/actions/auth-actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mobile, setMobile] = useState("9876543210");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await handleAdminLoginOrFirstTimeSetup({ mobile, password });

      if (result.success) {
        toast({
          title: result.isFirstAdmin ? "Admin Account Created" : "Login Successful",
          description: result.isFirstAdmin
            ? "The first admin account has been set up. Welcome!"
            : "You have successfully logged in.",
        });
        router.push("/admin/dashboard");
      } else {
        throw new Error(result.error || "An unknown error occurred.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center text-center">
             <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={40} height={40} className="object-contain mb-2" />
            <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="9876543210"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
