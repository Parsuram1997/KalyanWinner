
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import Image from 'next/image';

export default function WelcomePage() {
    const router = useRouter();
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        const storedUid = localStorage.getItem('lastUserUid');
        if (storedUid) {
            setStatus('Welcome back! Redirecting to PIN login...');
            // Add a small delay for the message to be visible
            setTimeout(() => router.replace('/pin-login'), 1000);
        } else {
            setStatus('Redirecting to login...');
            setTimeout(() => router.replace('/login'), 1000);
        }
    }, [router]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white">
            <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={120} height={120} className="object-contain" />
            <h1 className="text-4xl font-bold mt-4">Kalyan Winner</h1>
            <Loader className="h-8 w-8 animate-spin mt-8" />
            <p className="mt-4 text-lg text-white/80">{status}</p>
        </div>
    );
}
