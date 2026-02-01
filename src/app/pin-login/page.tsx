
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from "next/link";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { verifyPinAndLogin } from '@/app/actions/pin-actions';
import { signInWithCustomToken } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Loader } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PinLoginPage() {
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const [pin, setPin] = useState('');
    const [isPending, startTransition] = useTransition();
    const [lastUserUid, setLastUserUid] = useState<string | null>(null);

    useEffect(() => {
        const storedUid = localStorage.getItem('lastUserUid');
        if (!storedUid) {
            router.replace('/login');
        } else {
            setLastUserUid(storedUid);
        }
    }, [router]);

    const userDocRef = useMemoFirebase(
        () => (firestore && lastUserUid ? doc(firestore, 'users', lastUserUid) : null),
        [firestore, lastUserUid]
    );
    const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!lastUserUid || !auth) return;
        if (pin.length !== 4) {
            toast({ variant: 'destructive', title: 'Invalid PIN', description: 'PIN must be 4 digits.' });
            return;
        }

        startTransition(async () => {
            try {
                const result = await verifyPinAndLogin(lastUserUid, pin);
                if (result.success && result.token) {
                    // Sign in with the custom token
                    await signInWithCustomToken(auth, result.token);
                    // The onIdTokenChanged listener in login/page.tsx will handle session creation
                    toast({ title: 'Login Successful!' });
                    router.push('/dashboard');
                } else {
                    toast({ variant: 'destructive', title: 'Login Failed', description: result.message });
                    setPin('');
                }
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Login Error', description: error.message });
                setPin('');
            }
        });
    };
    
    const handleLogoutAndClear = () => {
        localStorage.removeItem('lastUserUid');
        router.replace('/login');
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white p-4">
            <Card className="w-full max-w-md bg-black/20 border-white/20 text-white backdrop-blur-md">
                <CardHeader className="text-center">
                    <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="mx-auto" />
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">
                        {isUserLoading ? <Skeleton className="h-8 w-48 mx-auto bg-white/20"/> : `Welcome Back, ${userData?.name || 'User'}!`}
                    </CardTitle>
                    <CardDescription className="text-white/80">
                        Enter your 4-digit PIN to login.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pin" className="sr-only">4-Digit PIN</Label>
                            <Input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                required
                                autoFocus
                                className="h-14 text-center text-3xl tracking-[1em] bg-black/20 border-white/20 text-white placeholder:text-lg placeholder:tracking-normal"
                                placeholder="----"
                            />
                        </div>
                        <Button type="submit" className="w-full !mt-8 h-12 bg-white text-primary font-bold hover:bg-white/90" disabled={isPending || isUserLoading}>
                            {isPending ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Login'}
                        </Button>
                    </form>
                </CardContent>
                 <CardFooter className="flex-col gap-4 text-center text-sm">
                    <Button variant="link" onClick={handleLogoutAndClear} className="text-white/70 hover:text-white">
                        Not you? Login with another account
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
