
'use client';

import { useState, useEffect } from "react";
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
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult, UserCredential } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Setup reCAPTCHA verifier
  useEffect(() => {
    if (!auth) return;
    if (window.recaptchaVerifier) return;

    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log("reCAPTCHA verified");
      },
    });
  }, [auth]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
      toast({ variant: "destructive", title: "Authentication not ready." });
      setIsLoading(false);
      return;
    }

    const fullPhoneNumber = `+91${phoneNumber}`;
    if (phoneNumber.length !== 10) {
      toast({ variant: "destructive", title: "Invalid Mobile Number", description: "Please enter a valid 10-digit mobile number." });
      setIsLoading(false);
      return;
    }

    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast({ title: "OTP Sent", description: `An OTP has been sent to ${fullPhoneNumber}` });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({ variant: "destructive", title: "Failed to Send OTP", description: error.message });
      // Reset reCAPTCHA if it fails
      if(window.recaptchaVerifier) {
          window.recaptchaVerifier.render().then((widgetId: any) => {
            if(window.grecaptcha){
              window.grecaptcha.reset(widgetId);
            }
          });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!confirmationResult) {
      toast({ variant: "destructive", title: "Verification failed", description: "Please request an OTP first." });
      setIsLoading(false);
      return;
    }
    if (otp.length !== 6) {
       toast({ variant: "destructive", title: "Invalid OTP", description: "OTP must be 6 digits." });
       setIsLoading(false);
       return;
    }

    try {
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;

      const userDocRef = doc(firestore!, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userRole = userDocSnap.data()?.role;
        if (userRole === 'User') {
          toast({ title: "Login Successful", description: "Welcome back!" });
          router.push("/(app)/dashboard");
        } else {
          toast({ variant: "destructive", title: "Access Denied", description: "This login is for users only." });
          await auth?.signOut();
        }
      } else {
        // First time login - create a user profile
        const newUserProfile = {
            id: user.uid,
            name: `User ${user.uid.substring(0, 5)}`,
            mobile: user.phoneNumber,
            email: user.email || `${user.phoneNumber}@kalyanwinner.app`, // Placeholder email
            state: "N/A",
            district: "N/A",
            balance: 0,
            status: "Active",
            role: "User",
            createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserProfile);
        toast({ title: "Account Created!", description: "Welcome to Kalyan Winner!" });
        router.push("/(app)/dashboard");
      }

    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.code === 'auth/invalid-verification-code'
          ? "The OTP you entered is incorrect. Please try again."
          : "An unexpected error occurred."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div id="recaptcha-container"></div>
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center text-center">
             <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={40} height={40} className="object-contain mb-2" />
            <CardTitle className="text-2xl font-bold">Kalyan Winner</CardTitle>
            <CardDescription>
              {!otpSent ? "Enter your mobile number to login" : "Enter the OTP sent to your mobile"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Mobile Number</Label>
                 <div className="flex items-center">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm h-10">+91</span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0,10))}
                      disabled={isLoading}
                      className="rounded-l-none"
                    />
                 </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify OTP & Login'}
              </Button>
              <Button variant="link" size="sm" onClick={() => {
                setOtpSent(false);
                setConfirmationResult(null);
              }}>
                Use another number?
              </Button>
            </form>
          )}

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
