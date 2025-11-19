
'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
       <div className="relative hidden lg:block">
         <Image
            src="/placeholder.svg"
            alt="Image"
            layout="fill"
            objectFit="cover"
            className="dark:brightness-[0.2] dark:grayscale"
        />
         <div className="relative z-10 flex h-full flex-col justify-end bg-black/50 p-10 text-white">
            <h2 className="text-4xl font-bold tracking-tight">Welcome Back to Kalyan Winner</h2>
            <p className="mt-4 text-lg">Your one-stop platform for gaming and rewards. Log in to continue your journey.</p>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <div className="flex justify-center mb-4">
                   <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {view === 'login' ? "Secure User Login" : "Reset Your Password"}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {view === 'login' ? "Enter your credentials to access your account." : "We'll send a password reset link to your email."}
                </p>
            </div>

            {view === 'login' && (
                 <form onSubmit={handleSubmit} className="space-y-4">
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
                            className="bg-gray-800 border-gray-700 h-12 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <Button variant="link" type="button" onClick={() => setView('forgot_password')} className="ml-auto px-0 h-auto text-sm text-primary hover:text-primary/90">
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
                            className="bg-gray-800 border-gray-700 h-12 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>
                    <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            )}

            {view === 'forgot_password' && (
                <div className="space-y-4">
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
                             className="bg-gray-800 border-gray-700 h-12 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>
                    <Button onClick={handleForgotPassword} className="w-full h-12 text-base" disabled={isLoading}>
                    {isLoading ? 'Sending Link...' : 'Send Password Reset Link'}
                    </Button>
                    <Button variant="outline" onClick={() => setView('login')} className="w-full h-12 border-gray-700 hover:bg-gray-800">
                        Back to Login
                    </Button>
                </div>
            )}

            <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">Don't have an account? <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">Sign up</Link></p>
            </div>
             <div className="mt-4 text-center text-xs text-muted-foreground">
                <Link href="/admin" className="underline underline-offset-2 hover:text-primary">Admin Login</Link>
                <span className="mx-2">|</span>
                <Link href="/enroller" className="underline underline-offset-2 hover:text-primary">Enroller Login</Link>
            </div>
        </div>
      </div>
    </div>
  );
}
