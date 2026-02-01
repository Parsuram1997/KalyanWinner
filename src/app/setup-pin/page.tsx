
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { setLoginPin } from '@/app/actions/pin-actions';
import { Loader } from 'lucide-react';

export default function SetupPinPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Not authenticated. Redirecting to login.' });
            router.push('/login');
            return;
        }
        if (pin.length !== 4) {
             toast({ variant: 'destructive', title: 'Invalid PIN', description: 'PIN must be 4 digits.' });
            return;
        }
        if (pin !== confirmPin) {
            toast({ variant: 'destructive', title: 'PINs do not match.' });
            return;
        }

        startTransition(async () => {
            try {
                await setLoginPin(user.uid, pin);
                toast({ title: 'PIN Set Successfully!', description: 'You can now use your PIN for faster logins.' });
                router.push('/dashboard');
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to Set PIN', description: error.message });
            }
        });
    };

    if (isUserLoading) {
         return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white">
                <Loader className="h-12 w-12 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white p-4">
            <Card className="w-full max-w-md bg-black/20 border-white/20 text-white backdrop-blur-md">
                <CardHeader className="text-center">
                    <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="mx-auto" />
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">Create a Login PIN</CardTitle>
                    <CardDescription className="text-white/80">
                        Create a 4-digit PIN for faster and secure access to your account.
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
                        <Button type="submit" className="w-full !mt-8 h-12 bg-white text-primary font-bold hover:bg-white/90" disabled={isPending || isUserLoading}>
                            {isPending ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Saving PIN...</> : 'Set PIN and Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
