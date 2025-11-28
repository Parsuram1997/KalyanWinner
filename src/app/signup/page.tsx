
'use client';

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
import { toast } from "@/hooks/use-toast";
import { createUser } from "@/app/actions/user-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { states, districts } from "@/lib/locations";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [enrollerId, setEnrollerId] = useState<string | null>(null);

  useEffect(() => {
    const enrollerIdFromQuery = searchParams.get("enrollerId");
    if (enrollerIdFromQuery) {
      setEnrollerId(enrollerIdFromQuery);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
        toast({
            variant: "destructive",
            title: "Passwords do not match",
            description: "Please make sure your passwords match.",
        });
        setIsLoading(false);
        return;
    }

    const userData: any = {
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      email: formData.get("email") as string,
      state: states.find(s => s.value === (formData.get("state") as string))?.label || '',
      district: districts[formData.get("state") as string]?.find(d => d.value === (formData.get("district") as string))?.label || '',
      password: password,
      role: 'User' as 'User',
      createdBy: 'Self' as 'Self',
    };

    if (enrollerId) {
      userData.enrollerId = enrollerId;
    }

    try {
      const result = await createUser(userData);
      if (result.success) {
        toast({
          title: "Signup Successful",
          description: "Your account has been created. Please login.",
        });
        router.push("/login");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="relative hidden items-center justify-center bg-gradient-to-br from-primary/80 via-primary to-secondary p-10 text-white lg:flex">
        <div className="relative z-10 w-full max-w-md rounded-xl bg-black/20 p-8 text-center backdrop-blur-sm">
            <h2 className="text-4xl font-bold tracking-tight">Join the Excitement!</h2>
            <p className="mt-4 text-lg text-primary-foreground/90">Create your account to experience the thrill of Kalyan Matka. Get instant access to playing, checking live results, and winning big. Your journey into the world of numbers starts here!</p>
        </div>
      </div>
       <div className="flex min-h-screen items-center justify-center bg-background p-4 py-12">
        <Card className="mx-auto w-full max-w-md">
            <CardHeader className="text-center">
             <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={60} height={60} className="object-contain mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold tracking-tight">Create an Account</CardTitle>
            <CardDescription>
              Enter your details below to join the fun.
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {enrollerId && (
              <Input type="hidden" name="enrollerId" value={enrollerId} />
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required disabled={isLoading} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="mobile">Mobile Number</Label>
               <div className="flex items-center">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm h-10">+91</span>
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    placeholder="9876543210"
                    required
                    onChange={(e) => e.target.value = e.target.value.replace(/\\D/g, '').slice(0,10)}
                    disabled={isLoading}
                    className="rounded-l-none"
                  />
               </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required disabled={isLoading} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Select name="state" onValueChange={setSelectedState} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                            {states.map(state => (
                                <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="district">District</Label>
                    <Select name="district" disabled={!selectedState} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedState && districts[selectedState] && districts[selectedState].map(district => (
                                <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          </CardContent>
          <CardFooter className="text-center text-sm">
            <p className="w-full">Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Login
            </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
        </Suspense>
    );
}
