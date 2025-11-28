
'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { getMessaging, getToken } from 'firebase/messaging';
import { saveFcmToken } from '@/app/actions/user-actions';
import { SidebarMenuButton } from './ui/sidebar';


export default function NotificationBell() {
  const { user } = useUser();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleSubscription = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please log in to enable notifications.' });
      return;
    }

    setIsSubscribing(true);

    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted') {
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { firebaseApp } = await import('@/firebase/client-provider');
        
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
            description: 'To get notifications, you need to allow them in your browser settings for this site.',
            duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error during notification setup:', error);
      toast({ variant: 'destructive', title: 'Subscription Failed', description: (error as Error).message });
    } finally {
      setIsSubscribing(false);
    }
  };

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (permission === 'granted') {
    return (
        <SidebarMenuButton disabled>
            <BellRing />
            Notifications
        </SidebarMenuButton>
    );
  }

   if (permission === 'denied') {
      return (
          <SidebarMenuButton
            onClick={() => toast({ title: 'Notifications Blocked', description: 'Please enable notifications for this site in your browser settings.'})}
          >
              <Bell />
              Notifications
          </SidebarMenuButton>
      );
  }
  
  return (
    <SidebarMenuButton onClick={handleSubscription} disabled={isSubscribing}>
        <Bell />
        Notifications
    </SidebarMenuButton>
  );
}
