'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setPinForUser } from '@/app/actions/pin-actions';
import Link from 'next/link';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

function SetupPinForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const uid = searchParams.get('uid');
    
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!uid) {
            toast({ variant: "destructive", title: "Authentication Error", description: "User ID not found. Please log in again." });
            router.push("/login");
            return;
        }

        if (pin.length !== 4) {
            toast({ variant: "destructive", title: "Invalid PIN", description: "Your PIN must be exactly 4 digits." });
            return;
        }

        if (pin !== confirmPin) {
            toast({ variant: "destructive", title: "PINs do not match", description: "Please make sure your PINs match." });
            return;
        }

        setIsPending(true);

        try {
            const result = await setPinForUser(uid, pin);

            if (result.success) {
                toast({ title: "PIN Set Successfully", description: "You can now log in with your new PIN." });
                router.push("/dashboard");
            } else {
                throw new Error(result.error || "An unknown error occurred.");
            }
        } catch (error: any) {
            console.error("PIN Setup Failed:", error);
            toast({
                variant: "destructive",
                title: "PIN Setup Failed",
                description: error.message || "Could not set your PIN. Please try again.",
            });
        } finally {
            setIsPending(false);
        }
    };

    if (!uid) {
        return (
             <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
                <Card className="w-full max-w-sm bg-black/20 border-white/20 text-white backdrop-blur-md">
                     <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>User ID not found in URL. Please log in again.</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <Button asChild className='w-full'>
                            <Link href="/login">Go to Login</Link>
                        </Button>
                     </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
            <Card className="w-full max-w-sm bg-black/20 border-white/20 text-white backdrop-blur-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">Create a PIN</CardTitle>
                    <CardDescription className="text-white/80">
                        For faster and more secure logins, please create a 4-digit PIN.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pin" className="text-white">New 4-Digit PIN</Label>
                            <Input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                required
                                className="h-12 text-center text-2xl tracking-[1em] bg-black/20 border-white/20 text-white placeholder:text-white/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPin" className="text-white">Confirm PIN</Label>
                             <Input
                                id="confirmPin"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                required
                                className="h-12 text-center text-2xl tracking-[1em] bg-black/20 border-white/20 text-white placeholder:text-white/50"
                            />
                        </div>
                        <Button type="submit" className="w-full !mt-8 h-12 bg-white text-primary font-bold hover:bg-white/90" disabled={isPending}>
                            {isPending ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Saving PIN...</> : 'Set PIN and Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SetupPinPage() {
    return (
      <Suspense fallback={
          <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
            <Loader className="h-12 w-12 text-white animate-spin" />
          </div>
      }>
        <SetupPinForm />
      </Suspense>
    );
}
