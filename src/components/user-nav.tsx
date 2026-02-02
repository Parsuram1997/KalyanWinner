
"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { Skeleton } from "./ui/skeleton";

export function UserNav() {
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, "users", authUser.uid) : null),
    [firestore, authUser]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<any>(userDocRef);

  const isLoading = isUserLoading || isUserDataLoading;

  const handleLogout = async () => {
    if (!auth) return;
    const role = userData?.role;
    try {
      await auth.signOut();
      
      // Clear user data from local storage
      localStorage.removeItem('lastUserUid');
      localStorage.removeItem('lastUserName');
      localStorage.removeItem('lastUserCustomId');
      localStorage.removeItem('lastUserMobile');

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });

      // Redirect based on role
      if (role === 'Admin') {
        router.replace('/admin');
      } else {
        router.replace('/welcome');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };

  if (isLoading) {
      return (
          <div className="flex items-center gap-2 p-1">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                   <Skeleton className="h-3 w-28" />
              </div>
          </div>
      )
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-white/20 p-2">
        <div className="flex items-center gap-3">
            <div className="text-xs">
                <p className="font-semibold text-white truncate">{userData?.name || 'User'}</p>
                <p className="text-white/80">{userData?.customId}</p>
                 <p className="text-white/80 truncate">{userData?.email}</p>
                <p className="text-white/80">{userData?.mobile}</p>
            </div>
        </div>
        <Button size="sm" onClick={handleLogout} className="w-full bg-transparent text-white border border-white/20 hover:bg-white/10 hover:text-white">
            <LogOut className="mr-2 h-4 w-4"/>
            Log out
        </Button>
    </div>
  );
}
