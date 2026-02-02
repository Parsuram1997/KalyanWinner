'use client';

import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { setPinForUser } from '@/app/actions/pin-actions';
import { useUser } from '@/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// New component for the PIN input boxes, similar to pin-login page
const PinInput = ({ length = 4, onPinChange, autoFocus = false }: { length?: number, onPinChange: (pin: string) => void, autoFocus?: boolean }) => {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    onPinChange(pin.join(''));
  }, [pin, onPinChange]);

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^[0-9]$/.test(value) && value !== '') {
        return;
    }
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value !== '' && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (paste) {
      const newPin = Array(length).fill('');
      paste.split('').forEach((char, index) => {
        newPin[index] = char;
      });
      setPin(newPin);
      const focusIndex = Math.min(paste.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  }

  return (
    <div className="flex justify-center gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="tel"
          inputMode='numeric'
          maxLength={1}
          value={pin[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="h-16 w-12 text-center text-3xl font-bold bg-black/20 border-white/20 text-white"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};


export default function SetupPinPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isUserLoading || !user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to set a PIN." });
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
            const result = await setPinForUser(user.uid, pin);

            if (result.success) {
                toast({ title: "PIN Set Successfully", description: "Your account is now more secure." });
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

    if (isUserLoading) {
        return (
            <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
                <CardHeader>
                    <Skeleton className="h-8 w-48 bg-white/10" />
                    <Skeleton className="h-4 w-64 mt-2 bg-white/10" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full bg-white/10" />
                        <Skeleton className="h-10 w-full bg-white/10" />
                        <Skeleton className="h-12 w-full mt-4 bg-white/10" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold tracking-tight text-white">Create or Update Your PIN</CardTitle>
                <CardDescription className="text-white/80">
                    For faster and more secure logins, please create a 4-digit PIN.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <Label htmlFor="pin" className="text-center block text-white">New 4-Digit PIN</Label>
                        <PinInput onPinChange={setPin} autoFocus={true} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPin" className="text-center block text-white">Confirm PIN</Label>
                        <PinInput onPinChange={setConfirmPin} />
                    </div>
                    <Button type="submit" className="w-full !mt-8 h-12 bg-white text-primary font-bold hover:bg-white/90" disabled={isPending || pin.length !== 4 || confirmPin.length !== 4}>
                        {isPending ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Saving PIN...</> : 'Set PIN'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
