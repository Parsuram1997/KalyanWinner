
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { getEmailForMobile } from "@/app/actions/auth-actions"; // Secure server action

type View = "login" | "forgot_password";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const [view, setView] = useState<View>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleForgotPassword = async () => {
    setIsLoading(true);
    if (!auth || !email) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: `A password reset link has been sent to ${email}.` });
      setView("login");
      setEmail("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to Send", description: "Please ensure the email address is correct." });
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
    
    const isMobile = !identifier.includes('@') && /^\d{10,15}$/.test(identifier);
    let userEmail = identifier;

    if (isMobile) {
        const result = await getEmailForMobile(identifier);
        if (result.error || !result.email) {
            toast({ variant: "destructive", title: "Login Failed", description: result.error || "Could not find email for this mobile number." });
            setIsLoading(false);
            return;
        }
        userEmail = result.email;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
        const user = userCredential.user;

        // Explicitly create server session
        const idToken = await user.getIdToken();
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData?.role === 'User') {
                toast({ title: "Login Successful", description: "Welcome back!" });
                
                // Store details for PIN login
                localStorage.setItem('lastUserUid', user.uid);
                localStorage.setItem('lastUserName', userData.name || 'User');
                localStorage.setItem('lastUserCustomId', userData.customId || '');
                
                if (userData.pin) {
                    router.push("/dashboard");
                } else {
                    toast({ title: "Setup PIN", description: "Please create a PIN for faster logins." });
                    router.push("/setup-pin");
                }
            } else {
                toast({ variant: "destructive", title: "Access Denied", description: "Please use the correct portal." });
                await auth.signOut();
            }
        } else {
            // This case handles users who exist in Auth but not Firestore (the "ghost" user issue)
            toast({ variant: "destructive", title: "Account Data Missing", description: "Your account data could not be found. Please contact support." });
            await auth.signOut();
        }

    } catch (error: any) {
        let description = "Invalid credentials. Please check your email/password.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "Invalid email or password.";
        }
        toast({ variant: "destructive", title: "Login Failed", description });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-gradient-to-br from-blue-600 to-purple-700">
       <div className="relative hidden items-center justify-center p-10 text-white lg:flex">
         <div className="relative z-10 w-full max-w-md rounded-xl bg-black/20 p-8 text-center backdrop-blur-sm border border-white/20">
            <h2 className="text-4xl font-bold tracking-tight">Welcome Back!</h2>
            <p className="mt-4 text-lg text-white/90">Log in to access your dashboard, view live results, place your bets, and manage your wallet.</p>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center text-white p-4">
        <Card className="w-full max-w-md bg-black/20 border-white/20 text-white backdrop-blur-md">
            <CardHeader className="text-center">
                <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="mx-auto" />
                <CardTitle className="text-3xl font-bold tracking-tight text-white">{view === 'login' ? "Secure User Login" : "Reset Password"}</CardTitle>
                <CardDescription className="text-white/80">{view === 'login' ? "Enter your credentials to log in." : "We'll email you a reset link."}</CardDescription>
            </CardHeader>
            <CardContent>
            {view === 'login' ? (
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="identifier" className="text-white">Email or Mobile Number</Label>
                        <Input id="identifier" placeholder="Email or Mobile" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={isLoading} className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/50" />
                    </div>
                    <div className="grid gap-2">
                         <div className="flex items-center"><Label htmlFor="password" className="text-white">Password</Label><Button variant="link" type="button" onClick={() => setView('forgot_password')} className="ml-auto px-0 h-auto text-sm text-white/70 hover:text-white">Forgot password?</Button></div>
                        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/50" />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-white text-primary font-bold hover:bg-white/90" disabled={isLoading}>{isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Logging in...</> : 'Login'}</Button>
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-white">Registered Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/50" />
                    </div>
                    <Button onClick={handleForgotPassword} className="w-full h-12 bg-white text-primary font-bold hover:bg-white/90" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send Reset Link'}</Button>
                    <Button variant="outline" onClick={() => setView('login')} className="w-full h-12 border-white/50 text-white hover:bg-white/10 hover:text-white">Back to Login</Button>
                </div>
            )}
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <p className="text-sm text-center w-full text-white/80">Don't have an account?{" "}
                <Link href="/signup" className="font-semibold text-yellow-300 hover:underline">Sign up</Link>
                </p>
                 <Link href="/admin" className="text-xs underline hover:text-yellow-300 text-white/70">Admin Login</Link>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
