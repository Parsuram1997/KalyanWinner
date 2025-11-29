
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
import { signInWithEmailAndPassword, sendPasswordResetEmail, UserCredential } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";


type View = "login" | "forgot_password";

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<View>("login");

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
        toast({
            variant: "destructive",
            title: "Authentication not ready",
            description: "Please wait a moment and try again.",
        });
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
            toast({
              title: "Admin Profile Created",
              description: "Your admin profile has been set up automatically.",
            });
          } catch (error) {
            console.error("Error creating admin profile in Firestore:", error);
            toast({
              variant: "destructive",
              title: "Database Error",
              description: "Could not create your admin profile in the database.",
            });
            auth.signOut();
            setIsLoading(false);
            return;
          }
      }

      if (userRole === 'Admin') {
        toast({
          title: "Login Successful",
          description: "Welcome, Admin!",
        });
        router.push("/admin/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to access the admin panel.",
        });
        await auth.signOut();
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.code === 'auth/invalid-credential' 
          ? "Invalid email or password. Please try again."
          : error.message || "An unexpected error occurred during login.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="relative hidden items-center justify-center bg-gradient-to-br from-primary/80 via-primary to-secondary p-10 text-white lg:flex">
        <div className="relative z-10 w-full max-w-md rounded-xl bg-black/20 p-8 text-center backdrop-blur-sm">
            <h2 className="text-4xl font-bold tracking-tight">Kalyan Winner Admin Panel</h2>
            <p className="mt-4 text-lg text-primary-foreground/90">
                This is your central hub for managing the entire Kalyan Winner platform. Access powerful tools for user management, transaction monitoring, result declaration, and application settings to ensure smooth and secure operations.
            </p>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
           <CardHeader className="text-center">
             <div className="flex justify-center mb-4">
               <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} />
             </div>
             <CardTitle className="text-3xl font-bold tracking-tight">{view === 'login' ? 'Admin Login' : 'Reset Password'}</CardTitle>
             <CardDescription>{view === 'login' ? 'Enter your credentials to access your dashboard.' : 'Enter your email to receive a password reset link.'}</CardDescription>
           </CardHeader>
            <CardContent>
            {view === 'login' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12 text-base"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                         <Button variant="link" type="button" onClick={() => setView('forgot_password')} className="ml-auto px-0 h-auto text-sm">
                            Forgot password?
                        </Button>
                    </div>
                    <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 text-base"
                    />
                </div>
                <Button type="submit" className="w-full !mt-8 h-12 text-base" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Authenticating...
                        </>
                    ) : 'Login to Your Account'}
                </Button>
                </form>
            ) : (
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
            <CardFooter className="text-center text-sm">
             <Link href="/" className="w-full font-semibold text-primary underline-offset-4 hover:underline">Go to Home</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
