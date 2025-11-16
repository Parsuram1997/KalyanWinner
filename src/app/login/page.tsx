
'use client';

import { useState, useRef } from "react";
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
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { resetPassword } from "@/app/actions/auth-actions";

type View = "login" | "forgot_password_mobile" | "forgot_password_otp" | "forgot_password_new";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const [view, setView] = useState<View>("login");

  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const setupRecaptcha = () => {
    if (!auth) return null;
    if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
    }
    return recaptchaVerifier.current;
  }

  const handleSendOtp = async () => {
      setIsLoading(true);
      if (!auth) {
          toast({ variant: "destructive", title: "Authentication not ready" });
          setIsLoading(false);
          return;
      }
      try {
          const verifier = setupRecaptcha();
          if (!verifier) throw new Error("Recaptcha not initialized");
          const formattedMobile = `+91${mobileNumber}`;
          const result = await signInWithPhoneNumber(auth, formattedMobile, verifier);
          setConfirmationResult(result);
          setView("forgot_password_otp");
          toast({ title: "OTP Sent", description: "Please check your mobile for the OTP." });
      } catch (error: any) {
          console.error(error);
          toast({ variant: "destructive", title: "Failed to send OTP", description: error.message });
      } finally {
          setIsLoading(false);
      }
  };

  const handleVerifyOtp = async () => {
      setIsLoading(true);
      if (!confirmationResult) {
          toast({ variant: "destructive", title: "Verification failed. Please try again." });
          setIsLoading(false);
          return;
      }
      try {
          await confirmationResult.confirm(otp);
          setView("forgot_password_new");
          toast({ title: "OTP Verified", description: "You can now set a new password." });
      } catch (error: any) {
          console.error(error);
          toast({ variant: "destructive", title: "Invalid OTP", description: "The OTP you entered is incorrect." });
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleResetPassword = async () => {
      setIsLoading(true);
      try {
          const result = await resetPassword(mobileNumber, newPassword);
          if (result.success) {
              toast({ title: "Password Reset Successful", description: "Please login with your new password." });
              setView("login");
              setMobileNumber("");
              setPassword("");
              setNewPassword("");
              setOtp("");
          } else {
              toast({ variant: "destructive", title: "Password Reset Failed", description: result.message });
          }
      } catch (error: any) {
           toast({ variant: "destructive", title: "An Error Occurred", description: error.message });
      } finally {
          setIsLoading(false);
      }
  }


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

    const email = `+91${mobileNumber}@kalyanwinner.app`;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

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
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Please use the correct portal for your role.",
          });
          await auth.signOut();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description: "Your user profile does not exist.",
        });
        await auth.signOut();
      }

    } catch (error: any) {
      let description = "An unexpected error occurred during login.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = "Invalid mobile number or password.";
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
            <CardTitle className="text-2xl font-bold">
                {view === 'login' && "User Login"}
                {view.startsWith('forgot_password') && "Forgot Password"}
            </CardTitle>
            <CardDescription>
                 {view === 'login' && "Enter your mobile number and password to login."}
                 {view === 'forgot_password_mobile' && "Enter your mobile number to reset your password."}
                 {view === 'forgot_password_otp' && `Enter the OTP sent to +91${mobileNumber}.`}
                 {view === 'forgot_password_new' && "Enter your new password."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
            <div id="recaptcha-container"></div>
            {view === 'login' && (
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
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <Button variant="link" type="button" onClick={() => setView('forgot_password_mobile')} className="ml-auto px-0 h-auto text-xs">
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
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            )}

            {view === 'forgot_password_mobile' && (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reset-phone">Mobile Number</Label>
                        <div className="flex items-center">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm h-10">+91</span>
                            <Input
                                id="reset-phone"
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
                    <Button onClick={handleSendOtp} className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                    <Button variant="outline" onClick={() => setView('login')} className="w-full">
                        Back to Login
                    </Button>
                </div>
            )}
            
            {view === 'forgot_password_otp' && (
                 <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                            id="otp"
                            type="text"
                            placeholder="6-digit code"
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <Button onClick={handleVerifyOtp} className="w-full" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                    <Button variant="outline" onClick={() => setView('forgot_password_mobile')} className="w-full">
                        Change Number
                    </Button>
                 </div>
            )}
            
            {view === 'forgot_password_new' && (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <Button onClick={handleResetPassword} className="w-full" disabled={isLoading}>
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </div>
            )}

            <div className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="underline">
                Sign up
                </Link>
            </div>
            <div className="mt-2 text-center text-sm flex justify-center items-center gap-2">
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
