'use client';

import Link from "next/link";
import Image from 'next/image';
import {
  Home,
  Wallet,
  Ticket,
  ClipboardList,
  GanttChartSquare,
  HelpCircle,
  Coins,
  Clock,
  Trophy,
  ScrollText,
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import { BottomNavBar } from "@/components/BottomNavBar";
import { clearUserPin } from '@/app/actions/pin-actions';
import { toast } from "@/hooks/use-toast";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-0 px-2">
          <div className="flex items-center justify-center p-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="object-contain" />
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard">
                  <Home />
                  Home
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/play">
                  <Ticket />
                  Play Games
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/bet-ledger">
                  <ScrollText />
                  Bets
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/game-timings">
                  <Clock />
                  Game Timings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/leaderboard">
                        <Trophy />
                        Leaderboard
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/results">
                  <ClipboardList />
                  Results
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/panel-chart">
                  <GanttChartSquare />
                  Panel Chart
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/wallet">
                  <Wallet />
                  Wallet
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/rates">
                  <Coins />
                  Game Rates
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/faq">
                  <HelpCircle />
                  FAQ
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mb-4">
          <SidebarSeparator />
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-dvh">
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-purple-700 px-4 sm:h-14 sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-white" />
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              {/* <ThemeToggle /> */}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 pb-20 md:p-6 min-w-0 bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900">{children}</main>
        </div>
         <BottomNavBar />
      </SidebarInset>
    </SidebarProvider>
  )
}

function LoadingScreen() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900">
            <Skeleton className="h-20 w-20 rounded-full bg-white/10" />
        </div>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();
  const cleanupStarted = useRef(false);

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    // Wait until all loading is complete before running any logic
    if (isUserLoading || (user && isUserDataLoading)) {
      return;
    }

    // CASE 1: No user authenticated. Redirect to welcome page.
    if (!user) {
      router.replace('/welcome');
      return;
    }

    // From here on, we know `user` is an object.

    // CASE 2: Ghost user (Auth user exists, but no Firestore doc). This is the critical case.
    if (!userData) {
      // If cleanup has already been initiated, do nothing further.
      if (cleanupStarted.current) return;
      
      // Mark cleanup as started to prevent loops.
      cleanupStarted.current = true;
      
      console.error("CRITICAL: User document not found for authenticated user:", user.uid);
      
      toast({ 
          variant: "destructive", 
          title: "Account Error", 
          description: "Your account data could not be found. You will be redirected to sign up.",
          duration: 10000 // Give user time to see it
      });

      // Perform a direct, forceful logout without waiting for onAuthStateChanged
      fetch('/api/auth/session', { method: 'DELETE' }); // Delete server session
      localStorage.clear(); // Clear local state
      
      // Redirect to signup to create a new, valid account
      router.replace('/signup');
      return;
    }
    
    // CASE 3: User is not a 'User' role (e.g., an Admin trying to access user app).
    if (userData.role !== 'User') {
      auth.signOut().then(() => {
          fetch('/api/auth/session', { method: 'DELETE' });
          router.replace('/login'); // Send them to the user login page, they might have a user account
      });
      return;
    }

    // CASE 4: User is valid, but PIN is not set. Redirect to setup.
    if (!userData.pin && pathname !== '/setup-pin') {
      router.replace(`/setup-pin?uid=${user.uid}`);
      return;
    }
    
    // CASE 5: Handle PIN reset request from another page (e.g., welcome page)
    if (sessionStorage.getItem('isPinReset') === 'true') {
        sessionStorage.removeItem('isPinReset');
        clearUserPin(user.uid).then((result) => {
            if (result.success) {
                toast({ title: "PIN Cleared", description: "Please set a new PIN." });
                router.replace(`/setup-pin?uid=${user.uid}`);
            } else {
                toast({ variant: "destructive", title: "Error", description: "Could not clear PIN." });
            }
        });
    }

  }, [user, isUserLoading, userData, isUserDataLoading, auth, router, pathname]);

  // Render logic: Show loading screen until auth state and user doc are resolved.
  if (isUserLoading || (user && isUserDataLoading)) {
    return <LoadingScreen />;
  }

  // If loading is done, but the conditions in useEffect are not met yet,
  // we might be in a redirect state. Show loading screen to prevent content flashing.
  if (!user || !userData || userData.role !== 'User' || (!userData.pin && pathname !== '/setup-pin')) {
    return <LoadingScreen />;
  }

  // All checks passed, render the actual app content.
  return <AppLayoutContent>{children}</AppLayoutContent>;
}
