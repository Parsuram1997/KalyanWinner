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

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const cleanupStarted = useRef(false);

  // This single useEffect handles all auth-related side-effects.
  useEffect(() => {
    // A. Pin reset logic
    if (user && sessionStorage.getItem('isPinReset') === 'true') {
        sessionStorage.removeItem('isPinReset');
        clearUserPin(user.uid).then((result) => {
            if (result.success) {
                toast({ title: "PIN Cleared", description: "Please set a new PIN." });
                router.replace(`/setup-pin?uid=${user.uid}`);
            } else {
                toast({ variant: "destructive", title: "Error", description: "Could not clear PIN." });
            }
        });
        return; // Don't continue to other checks
    }

    // B. Ghost user cleanup logic
    // This runs when auth is loaded, a user is authenticated, but their Firestore doc is definitively not found.
    if (user && !isUserLoading && !isUserDataLoading && !userData) {
      if (!cleanupStarted.current) {
        cleanupStarted.current = true;
        
        console.error("CRITICAL: User document not found for authenticated user:", user.uid);
        
        toast({ 
            variant: "destructive", 
            title: "Account Error", 
            description: "Your account data could not be found. Please sign up again.",
            duration: 10000
        });
        
        auth.signOut().then(() => {
            fetch('/api/auth/session', { method: 'DELETE' });
            localStorage.clear();
            router.replace('/signup');
        });
      }
    }
  }, [user, isUserLoading, isUserDataLoading, userData, auth, router]);


  // 1. Primary loading states.
  if (isUserLoading || (user && isUserDataLoading)) {
    return <LoadingScreen />;
  }

  // 2. No user is authenticated.
  if (!user) {
    router.replace('/welcome');
    return <LoadingScreen />;
  }

  // 3. Ghost user case: Authenticated, but no corresponding document in Firestore.
  // The useEffect above handles the cleanup. We just show a loading screen while it happens.
  if (!userData) {
    return <LoadingScreen />;
  }

  // 4. Role check: Ensure the user has the 'User' role.
  if (userData.role !== 'User') {
      auth.signOut().then(() => {
          fetch('/api/auth/session', { method: 'DELETE' });
          router.replace('/login');
      });
      return <LoadingScreen />;
  }

  // 5. PIN check: Ensure user has a PIN set.
  if (!userData.pin && pathname !== '/setup-pin') {
      router.replace(`/setup-pin?uid=${user.uid}`);
      return <LoadingScreen />;
  }
  
  // 6. All checks passed. Render the main application layout.
  return <AppLayoutContent>{children}</AppLayoutContent>;
}
