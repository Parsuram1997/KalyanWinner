
"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { Skeleton } from "./ui/skeleton";

export function UserNav() {
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, "users", authUser.uid) : null),
    [firestore, authUser]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<any>(userDocRef);

  const isLoading = isUserLoading || isUserDataLoading;

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      // Redirect to a public page after logout
      router.push('/login');
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
    <div className="flex w-full flex-col gap-2 rounded-md border p-2">
        <div className="flex items-center gap-3">
            <div className="text-xs">
                <p className="font-semibold text-foreground truncate">{userData?.name || 'User'}</p>
                <p className="text-muted-foreground">{userData?.customId}</p>
                 <p className="text-muted-foreground truncate">{userData?.email}</p>
                <p className="text-muted-foreground">{userData?.mobile}</p>
            </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4"/>
            Log out
        </Button>
    </div>
  );
}
