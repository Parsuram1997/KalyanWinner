'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { createUser } from '@/app/actions/user-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { states, districts } from '@/lib/locations';
import { Loader } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
      });
      setIsLoading(false);
      return;
    }

    const userData: any = {
      name: formData.get('name') as string,
      mobile: formData.get('mobile') as string,
      email: formData.get('email') as string,
      state: states.find(s => s.value === (formData.get('state') as string))?.label || '',
      district:
        districts[formData.get('state') as string]?.find(
          d => d.value === (formData.get('district') as string),
        )?.label || '',
      password: password,
      role: 'User' as 'User',
      createdBy: 'Self' as 'Self',
    };

    try {
      await createUser(userData);
      toast({
        title: 'Signup Successful',
        description: 'Your account has been created. Please log in.',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
     <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="relative hidden items-center justify-center p-10 text-white lg:flex">
            <div className="relative z-10 w-full max-w-md rounded-xl bg-black/20 p-8 text-center backdrop-blur-sm border border-white/20">
                <h2 className="text-4xl font-bold tracking-tight">Join the Excitement!</h2>
                <p className="mt-4 text-lg text-white/90">Create your account to experience the thrill of Kalyan Matka. Get instant access to playing, checking live results, and winning big. Your journey into the world of numbers starts here!</p>
            </div>
        </div>
        <div className="flex min-h-screen items-center justify-center p-4 py-12">
            <Card className="w-full max-w-md bg-black/20 border-white/20 text-white backdrop-blur-md">
                <CardHeader className="text-center">
                    <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={60} height={60} className="object-contain mx-auto mb-4" />
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">Create an Account</CardTitle>
                    <CardDescription className="text-white/80">
                    Enter your details below to join the fun.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-white">Full Name</Label>
                            <Input id="name" name="name" required disabled={isLoading} className="bg-black/20 border-white/20 text-white placeholder:text-white/50"/>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="mobile" className="text-white">Mobile Number</Label>
                            <div className="flex items-center">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/20 bg-white/10 text-sm h-10">+91</span>
                                <Input
                                    id="mobile"
                                    name="mobile"
                                    type="tel"
                                    placeholder="9876543210"
                                    required
                                    onChange={(e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0,10)}
                                    disabled={isLoading}
                                    className="rounded-l-none bg-black/20 border-white/20 text-white placeholder:text-white/50 h-10"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-white">Email</Label>
                            <Input id="email" name="email" type="email" required disabled={isLoading} className="bg-black/20 border-white/20 text-white placeholder:text-white/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="state" className="text-white">State</Label>
                                <Select name="state" onValueChange={setSelectedState} required>
                                    <SelectTrigger className="bg-black/20 border-white/20 text-white">
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black/80 border-white/20 text-white backdrop-blur-lg">
                                        {states.map(state => (
                                            <SelectItem key={state.value} value={state.value} className="cursor-pointer hover:bg-white/20">{state.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="district" className="text-white">District</Label>
                                <Select name="district" disabled={!selectedState} required>
                                    <SelectTrigger className="bg-black/20 border-white/20 text-white">
                                        <SelectValue placeholder="Select district" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black/80 border-white/20 text-white backdrop-blur-lg">
                                        {selectedState && districts[selectedState] && districts[selectedState].map(district => (
                                            <SelectItem key={district.value} value={district.value} className="cursor-pointer hover:bg-white/20">{district.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-white">Password</Label>
                            <Input id="password" name="password" type="password" required disabled={isLoading} className="bg-black/20 border-white/20 text-white"/>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required disabled={isLoading} className="bg-black/20 border-white/20 text-white"/>
                        </div>
                        <Button type="submit" className="w-full bg-white text-primary font-bold hover:bg-white/90" disabled={isLoading}>
                        {isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : 'Create Account'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center text-sm">
                    <p className="w-full text-white/80">Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-yellow-300 hover:underline">
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
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
                <Loader className="h-12 w-12 text-white animate-spin" />
            </div>
        );
    }
    
    return (
        <Suspense fallback={
          <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
            <Loader className="h-12 w-12 text-white animate-spin" />
          </div>
        }>
            <SignupForm />
        </Suspense>
    );
}
