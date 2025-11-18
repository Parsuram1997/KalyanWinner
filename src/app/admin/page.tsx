
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail, UserCredential } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

type View = "login" | "forgot_password";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [email, setEmail] = useState("admin@kalyanwinner.app");
  const [password, setPassword] = useState("password");
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
      <div className="relative hidden lg:block">
        <Image 
          src="/placeholder.svg" 
          alt="Login background image" 
          layout="fill"
          objectFit="cover"
          className="opacity-90"
        />
        <div className="relative z-10 flex h-full flex-col justify-end bg-black/50 p-10 text-white">
            <h2 className="text-4xl font-bold tracking-tight">Kalyan Winner Admin Panel</h2>
            <p className="mt-4 text-lg">Your central hub for managing the Kalyan Winner platform. Access all tools and settings to ensure smooth operations.</p>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="mx-auto w-full max-w-md shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
                <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={60} height={60} />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">{view === 'login' ? 'Admin Login' : 'Reset Password'}</CardTitle>
            <CardDescription>
              {view === 'login' ? 'Enter your credentials to access your dashboard.' : 'Enter your email to receive a password reset link.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view === 'login' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="text-base py-6"
                    />
                </div>
                <div className="space-y-2">
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
                    className="text-base py-6"
                    />
                </div>
                <Button type="submit" className="w-full !mt-8 text-base py-6" disabled={isLoading}>
                    {isLoading ? 'Authenticating...' : 'Login to Your Account'}
                </Button>
                </form>
            ) : (
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
          </CardContent>
           <CardFooter className="flex justify-center text-sm">
             <Link href="/" className="font-semibold text-primary underline-offset-4 hover:underline">Go to Home</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
