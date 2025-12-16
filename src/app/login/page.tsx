
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
import { signInWithEmailAndPassword, sendPasswordResetEmail, onIdTokenChanged } from "firebase/auth";
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
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (view === 'login') {
        e.preventDefault();
        const message = "Kya aap वाकई वापस जाना चाहते हैं?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [view]);

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
        description: `A link to reset your password has been sent to ${email}. Please check your spam folder.`,
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

    let userEmail = identifier;
    if (!identifier.includes('@') && /^\d+$/.test(identifier)) {
        try {
            const usersRef = collection(firestore, "users");
            const q = query(usersRef, where("mobile", "==", identifier), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) throw new Error("No account found with this mobile number.");
            
            userEmail = querySnapshot.docs[0].data().email;
            if (!userEmail) throw new Error("Associated email not found.");

        } catch (error: any) {
            toast({ variant: "destructive", title: "Login Failed", description: error.message });
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
            if (userDocSnap.data()?.role === 'User') {
                toast({ title: "Login Successful", description: "Welcome back!" });
                router.push("/dashboard");
            } else {
                toast({ variant: "destructive", title: "Access Denied", description: "Please use the correct portal." });
                await auth.signOut();
            }
        } else {
            toast({ variant: "destructive", title: "Profile Not Found" });
            await auth.signOut();
        }

    } catch (error: any) {
        let description = "Invalid credentials. Please check your details.";
        if (error.code === 'auth/missing-email') {
            description = "Could not find an email for the provided mobile number.";
        }
        toast({ variant: "destructive", title: "Login Failed", description });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
       <div className="relative hidden items-center justify-center bg-gradient-to-br from-primary/80 via-primary to-secondary p-10 text-white lg:flex">
         <div className="relative z-10 w-full max-w-md rounded-xl bg-black/20 p-8 text-center backdrop-blur-sm">
            <h2 className="text-4xl font-bold tracking-tight">Welcome Back!</h2>
            <p className="mt-4 text-lg text-primary-foreground/90">Log in to access your dashboard, view live results, place your bets, and manage your wallet.</p>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="mx-auto" />
                <CardTitle className="text-3xl font-bold tracking-tight">{view === 'login' ? "Secure User Login" : "Reset Password"}</CardTitle>
                <CardDescription>{view === 'login' ? "Enter your credentials to log in." : "We'll email you a reset link."}</CardDescription>
            </CardHeader>
            <CardContent>
            {view === 'login' ? (
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="identifier">Email or Mobile Number</Label>
                        <Input id="identifier" placeholder="Email or Mobile" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={isLoading} className="h-12" />
                    </div>
                    <div className="grid gap-2">
                         <div className="flex items-center"><Label htmlFor="password">Password</Label><Button variant="link" type="button" onClick={() => setView('forgot_password')} className="ml-auto px-0 h-auto text-sm">Forgot password?</Button></div>
                        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="h-12" />
                    </div>
                    <Button type="submit" className="w-full h-12" disabled={isLoading}>{isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Logging in...</> : 'Login'}</Button>
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Registered Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="h-12" />
                    </div>
                    <Button onClick={handleForgotPassword} className="w-full h-12" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send Reset Link'}</Button>
                    <Button variant="outline" onClick={() => setView('login')} className="w-full h-12">Back to Login</Button>
                </div>
            )}
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <p className="text-sm text-center w-full">Don't have an account? <Link href="/signup" className="font-semibold text-primary hover:underline">Sign up</Link></p>
                 <Link href="/admin" className="text-xs underline hover:text-primary">Admin Login</Link>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
