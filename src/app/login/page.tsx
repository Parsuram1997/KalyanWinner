
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    if (mobileNumber.length !== 10) {
      toast({
        variant: "destructive",
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
      });
      setIsLoading(false);
      return;
    }

    // Construct the dummy email from the mobile number
    const email = `+91${mobileNumber}@kalyanwinner.app`;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // After successful sign-in, check user's role from Firestore.
      const userDocRef = doc(firestore, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userRole = userDocSnap.data()?.role;

        if (userRole === 'User') {
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
          router.push("/dashboard");
        } else {
          // If the user is an admin or enroller, they shouldn't log in here.
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Please use the Admin or Enroller login page.",
          });
          await auth.signOut();
        }
      } else {
        // This case should ideally not happen if users are created by admins/enrollers
        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description: "Your user profile does not exist. Please contact support.",
        });
        await auth.signOut();
      }

    } catch (error: any) {
      let description = "An unexpected error occurred during login.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = "Invalid mobile number or password. Please try again.";
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
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
            <CardTitle className="text-2xl font-bold">Kalyan Winner</CardTitle>
            <CardDescription>
              Enter your mobile number and password to login.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Mobile Number</Label>
               <div className="flex items-center">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm h-10">+91</span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0,10))}
                    disabled={isLoading}
                    className="rounded-l-none"
                  />
               </div>
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

          <div className="mt-4 text-center text-sm flex justify-center items-center gap-2">
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
