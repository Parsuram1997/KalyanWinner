'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { verifyPinForUser } from '@/app/actions/pin-actions';
import { signInWithCustomToken } from 'firebase/auth';
import { Loader } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function PinLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [userName, setUserName] = useState('');
  const [customId, setCustomId] = useState('');

  const uid = searchParams.get('uid');

  useEffect(() => {
    setUserName(localStorage.getItem('lastUserName') || 'User');
    setCustomId(localStorage.getItem('lastUserCustomId') || '');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lastUserUid');
    localStorage.removeItem('lastUserName');
    localStorage.removeItem('lastUserCustomId');
    localStorage.removeItem('lastUserMobile');
    router.push('/login');
  };

  if (!uid) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <p>User information not provided.</p>
        <Link href="/login" className="text-yellow-300 hover:underline mt-4">
          Return to Login
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const pin = formData.get('pin') as string;

    try {
      if (!auth) throw new Error('Authentication service is not available.');

      const result = await verifyPinForUser(uid, pin);

      if (result.success) {
        const userCredential = await signInWithCustomToken(auth, result.token);
        const idToken = await userCredential.user.getIdToken();

        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/dashboard');
      } else {
        throw new Error(result.error || 'Invalid PIN.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'PIN Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <Card className="bg-black/20 border-white/20 text-white backdrop-blur-md">
        <CardHeader className="items-center text-center">
           <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="object-contain mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-white">
            Welcome
          </CardTitle>
          <p className="text-xl text-yellow-300 pt-1">{userName}</p>
          <p className="text-xs text-white/70">{customId}</p>
          <CardDescription className="text-white/80 pt-2">
            Enter your PIN to login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium text-white/80">4-Digit PIN</Label>
              <Input 
                id="pin" 
                name="pin" 
                type="password" 
                required 
                maxLength={4} 
                pattern="\d{4}" 
                className="h-14 bg-black/20 border-white/20 text-white text-center text-3xl tracking-[1.5rem]" 
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-white text-primary font-bold hover:bg-white/90" disabled={isLoading}>
              {isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2 pt-4">
          <Button variant="link" onClick={handleLogout} className="text-yellow-300 hover:underline text-sm font-normal">
            Login with another account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PinLoginPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <Suspense fallback={<PinLoginSkeleton />}>
        <PinLoginForm />
      </Suspense>
    </div>
  );
}

function PinLoginSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto">
      <Card className="bg-black/20 border-white/20 text-white backdrop-blur-md">
        <CardHeader className="items-center text-center">
          <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
          <Skeleton className="h-7 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-14 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </CardContent>
        <CardFooter className="flex-col gap-2 pt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </CardFooter>
      </Card>
    </div>
  );
}
