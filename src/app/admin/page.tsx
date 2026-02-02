'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";

type View = "login" | "forgot_password";

export default function AdminLoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<View>("login");

  // REMOVED: The problematic useEffect that was calling /api/auth/session
  // This was conflicting with the client-side auth flow.

  const handleForgotPassword = async () => {
    setIsLoading(true);
    if (!auth || !email) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
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
      setEmail("");
    } catch (error: any) {
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

      let userRole;
      if (userDocSnap.exists()) {
        userRole = userDocSnap.data()?.role;
      } else {
         try {
            await setDoc(userDocRef, {
              id: user.uid,
              email: user.email,
              name: user.displayName || "Admin User",
              role: "Admin",
              status: "Active",
              balance: 0,
              mobile: user.phoneNumber || "N/A",
              state: "N/A",
              district: "N/A",
              createdAt: serverTimestamp(),
            });
            userRole = "Admin";
            toast({ title: "Admin Profile Created" });
          } catch (error) {
            toast({ variant: "destructive", title: "Database Error", description: "Could not create admin profile." });
            auth.signOut();
            setIsLoading(false);
            return;
          }
      }

      if (userRole === 'Admin') {
        toast({ title: "Login Successful", description: "Redirecting to dashboard..." });
        // Use window.location.href for a full page reload to ensure auth state is propagated before the layout guard runs.
        window.location.href = "/admin/dashboard";
      } else {
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission." });
        await auth.signOut();
        setIsLoading(false);
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.code === 'auth/invalid-credential' 
          ? "Invalid email or password."
          : "An unexpected error occurred.",
      });
      setIsLoading(false); // Ensure loading is stopped on failure
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="relative hidden items-center justify-center p-10 text-white lg:flex">
        <div className="relative z-10 w-full max-w-md rounded-xl bg-black/20 p-8 text-center backdrop-blur-sm border-white/20">
            <h2 className="text-4xl font-bold tracking-tight">Kalyan Winner Admin Panel</h2>
            <p className="mt-4 text-lg text-white/90">Manage users, transactions, results, and application settings.</p>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center text-white p-4">
        <Card className="w-full max-w-md bg-black/20 border-white/20 text-white backdrop-blur-md">
           <CardHeader className="text-center">
               <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="mx-auto mb-4" />
             <CardTitle className="text-3xl font-bold tracking-tight text-white">{view === 'login' ? 'Admin Login' : 'Reset Password'}</CardTitle>
             <CardDescription className="text-white/80">{view === 'login' ? 'Enter credentials to access your dashboard.' : 'Enter your email for a password reset link.'}</CardDescription>
           </CardHeader>
            <CardContent>
            {view === 'login' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input id="email" type="email" placeholder="admin@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/50" />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <Label htmlFor="password" className="text-white">Password</Label>
                         <Button variant="link" type="button" onClick={() => setView('forgot_password')} className="ml-auto px-0 h-auto text-sm text-white/70 hover:text-white">Forgot password?</Button>
                    </div>
                    <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/50" />
                </div>
                <Button type="submit" className="w-full !mt-8 h-12 bg-white text-primary font-bold hover:bg-white/90" disabled={isLoading}>{isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Authenticating...</> : 'Login'}</Button>
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-white">Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/50" />
                    </div>
                    <Button onClick={handleForgotPassword} className="w-full h-12 bg-white text-primary font-bold hover:bg-white/90" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send Reset Link'}</Button>
                    <Button variant="outline" onClick={() => setView('login')} className="w-full h-12 border-white/50 text-white hover:bg-white/10 hover:text-white">Back to Login</Button>
                </div>
            )}
           </CardContent>
            <CardFooter className="text-center text-sm">
             <Link href="/" className="w-full font-semibold text-yellow-300 hover:underline">Go to Home</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
