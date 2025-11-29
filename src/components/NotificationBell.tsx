
'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { initializeFirebase } from '@/firebase';


export default function NotificationBell() {
  const { user } = useUser();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleSubscription = async (checked: boolean) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please log in to enable notifications.' });
      return;
    }

    if (permission === 'granted' && !checked) {
        toast({
            title: "How to Disable Notifications",
            description: "Please block notifications for this site from your browser's settings.",
            duration: 5000,
        });
        return;
    }

    if (permission === 'denied') {
        toast({
            title: "Notifications Blocked",
            description: "You need to manually unblock notifications from your browser settings first.",
            duration: 5000,
        });
        return;
    }

    if (checked) {
        setIsSubscribing(true);

        try {
          const currentPermission = await Notification.requestPermission();
          setPermission(currentPermission);

          if (currentPermission === 'granted') {
            const { getMessaging, getToken } = await import('firebase/messaging');
            const { firebaseApp } = initializeFirebase();
            
            const messaging = getMessaging();
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

            if (!vapidKey) {
                console.error("VAPID key is missing. Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to your environment variables.");
                toast({ variant: "destructive", title: "Configuration Error", description: "Cannot enable notifications. Missing VAPID key." });
                setIsSubscribing(false);
                return;
            }

            const fcmToken = await getToken(messaging, { vapidKey });

            if (fcmToken) {
              await saveFcmToken(user.uid, fcmToken);
              toast({ title: 'Notifications Enabled!', description: 'You will now receive updates on new results.' });
            } else {
              throw new Error('Could not get the notification token.');
            }
          } else {
            toast({ 
                variant: 'destructive', 
                title: 'Permission Denied', 
                description: 'You did not grant permission for notifications.',
                duration: 5000,
            });
          }
        } catch (error) {
          console.error('Error during notification setup:', error);
          toast({ variant: 'destructive', title: 'Subscription Failed', description: (error as Error).message });
        } finally {
          setIsSubscribing(false);
        }
    }
  };

  if (!isClient || typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent">
        <Label htmlFor="notification-switch" className="flex items-center gap-2 cursor-pointer text-sm">
            {permission === 'granted' ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            <span>Notifications</span>
        </Label>
        <Switch
            id="notification-switch"
            checked={permission === 'granted'}
            onCheckedChange={handleSubscription}
            disabled={isSubscribing || permission === 'denied'}
            aria-label="Toggle notifications"
        />
    </div>
  );
}
