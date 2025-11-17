
'use client';

import { useState } from "react";
import Link from "next/link";
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
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getEmailForMobile } from "@/app/actions/user-actions";

type View = "login" | "forgot_password";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async () => {
    setIsLoading(true);
    if (!auth) {
      toast({ variant: "destructive", title: "Authentication service not ready." });
      setIsLoading(false);
      return;
    }
     if (!email) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: `A link to reset your password has been sent to ${email}.`,
      });
      setView("login");
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Failed to send reset email", description: "Please ensure the email is correct." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "Authentication not ready" });
      setIsLoading(false);
      return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userRole = userDocSnap.data()?.role;
            if (userRole === 'User') {
            toast({ title: "Login Successful", description: "Welcome back!" });
            router.push("/dashboard");
            } else {
            toast({ variant: "destructive", title: "Access Denied", description: "Please use the correct portal for your role." });
            await auth.signOut();
            }
        } else {
            toast({ variant: "destructive", title: "Profile Not Found", description: "Your user profile does not exist." });
            await auth.signOut();
        }

    } catch (error: any) {
        let description = "An unexpected error occurred during login.";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            description = "Invalid email or password.";
        }
        toast({ variant: "destructive", title: "Login Failed", description: description });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center text-center">
             <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={100} height={100} className="object-contain mb-2" />
            <CardTitle className="text-2xl font-bold">
                {view === 'login' ? "User Login" : "Forgot Password"}
            </CardTitle>
            <CardDescription>
                 {view === 'login' ? "Enter your email and password to login." : "Enter your registered email to receive a password reset link."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
            {view === 'login' && (
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <Button variant="link" type="button" onClick={() => setView('forgot_password')} className="ml-auto px-0 h-auto text-xs">
                                Forgot password?
                            </Button>
                        </div>
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
            )}

            {view === 'forgot_password' && (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                            id="reset-email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <Button onClick={handleForgotPassword} className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending Link...' : 'Send Password Reset Link'}
                    </Button>
                    <Button variant="outline" onClick={() => setView('login')} className="w-full">
                        Back to Login
                    </Button>
                </div>
            )}

            <div className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="underline">
                Sign up
                </Link>
            </div>
            <div className="mt-2 text-center text-sm flex justify-center items-center gap-2">
                <Link href="/admin" className="underline">
                Admin login
                </Link>
                <span>|</span>
                <Link href="/enroller" className="underline">
                Enroller login
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
