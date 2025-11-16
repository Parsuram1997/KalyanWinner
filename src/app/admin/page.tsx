
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
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";


export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [email, setEmail] = useState("admin@kalyanwinner.app");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);

  const handleFirstLoginSetup = async (user: UserCredential['user']) => {
    if (!firestore) return;

    const userDocRef = doc(firestore, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // This is the first login, create the user document in Firestore
      try {
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          name: user.displayName || "Admin User",
          role: "Admin", // Assign Admin role
          status: "Active",
          balance: 0,
          mobile: user.phoneNumber || "N/A",
          state: "N/A",
          district: "N/A",
          createdAt: serverTimestamp(),
        });
        toast({
          title: "Admin Profile Created",
          description: "Your admin profile has been set up in the database.",
        });
      } catch (error) {
        console.error("Error creating admin profile in Firestore:", error);
        toast({
          variant: "destructive",
          title: "Database Error",
          description: "Could not create your admin profile in the database.",
        });
        // Log out the user if the profile creation fails to avoid inconsistent state
        auth?.signOut();
        throw error; // Propagate error to stop execution
      }
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

      // After successful sign-in, check if it's a first-time login for this user
      await handleFirstLoginSetup(userCredential.user);

      toast({
        title: "Login Successful",
        description: "You have successfully logged in.",
      });
      router.push("/admin/dashboard");
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
