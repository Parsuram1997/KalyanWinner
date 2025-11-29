
'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";

type View = "login" | "forgot_password";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const [view, setView] = useState<View>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // Used for both login and reset
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
        description: "Please enter a valid email address to reset your password.",
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
      setEmail("");
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

    let userEmail = identifier;

    if (!identifier.includes('@') && /^\d+$/.test(identifier)) {
        try {
            const usersRef = collection(firestore, "users");
            const q = query(usersRef, where("mobile", "==", identifier), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("No account found with this mobile number.");
            }
            
            const userData = querySnapshot.docs[0].data();
            userEmail = userData.email;

            if (!userEmail) {
                throw new Error("Associated email not found for this mobile number.");
            }

        } catch (error: any) {
            toast({ variant: "destructive", title: "Login Failed", description: error.message || "Could not find user with this mobile number." });
            setIsLoading(false);
            return;
        }
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
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
            description = "Invalid credentials. Please check your email/mobile and password.";
        } else if (error.code === 'auth/missing-email') {
            description = "Could not find an email associated with the provided mobile number.";
        }
        toast({ variant: "destructive", title: "Login Failed", description: description });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
       <div className="relative hidden items-center justify-center bg-gradient-to-br from-primary/80 via-primary to-secondary p-10 text-white lg:flex">
         <div className="relative z-10 w-full max-w-md rounded-xl bg-black/20 p-8 text-center backdrop-blur-sm">
            <h2 className="text-4xl font-bold tracking-tight">Welcome Back!</h2>
            <p className="mt-4 text-lg text-primary-foreground/90">Log in to access your dashboard, view live results, place your bets on various markets, and manage your wallet. Your exciting gaming journey awaits!</p>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                   <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} />
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight">
                    {view === 'login' ? "Secure User Login" : "Reset Your Password"}
                </CardTitle>
                <CardDescription>
                    {view === 'login' ? "Enter your credentials to access your account." : "We'll send a password reset link to your email."}
                </CardDescription>
            </CardHeader>
            <CardContent>
            {view === 'login' && (
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="identifier">Email or Mobile Number</Label>
                        <Input
                            id="identifier"
                            type="text"
                            placeholder="Email or Mobile Number"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            disabled={isLoading}
                            className="h-12 text-base"
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
                            className="h-12 text-base"
                        />
                    </div>
                    <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Logging in...
                            </>
                        ) : 'Login'}
                    </Button>
                </form>
            )}

            {view === 'forgot_password' && (
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Your Registered Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                             className="h-12 text-base"
                        />
                    </div>
                    <Button onClick={handleForgotPassword} className="w-full h-12 text-base" disabled={isLoading}>
                    {isLoading ? 'Sending Link...' : 'Send Password Reset Link'}
                    </Button>
                    <Button variant="outline" onClick={() => setView('login')} className="w-full h-12">
                        Back to Login
                    </Button>
                </div>
            )}
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <div className="text-center text-sm">
                    <p className="text-muted-foreground">Don't have an account? <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">Sign up</Link></p>
                </div>
                 <div className="text-center text-xs text-muted-foreground">
                    <Link href="/admin" className="underline underline-offset-2 hover:text-primary">Admin Login</Link>
                    <span className="mx-2">|</span>
                    <Link href="/enroller" className="underline underline-offset-2 hover:text-primary">Enroller Login</Link>
                </div>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
