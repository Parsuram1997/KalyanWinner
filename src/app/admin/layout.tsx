
'use client';

import Link from "next/link";
import Image from 'next/image';
import {
  Users,
  ClipboardList,
  LayoutDashboard,
  Wallet,
  Settings,
  Ticket,
  Landmark,
  Store,
  Clock,
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
import { useAuth, useFirestore } from "@/firebase"; // We still need these for the instances
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
        <Sidebar>
            <SidebarHeader className="p-0 px-2">
            <div className="flex items-center justify-center p-4">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                    <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="object-contain" />
                </Link>
            </div>
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/dashboard">
                    <LayoutDashboard />
                    Dashboard
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/admins">
                    <Users />
                    Admins
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/users">
                    <Users />
                    Users
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-bidding">
                    <Ticket />
                    Manage Bidding
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-bets">
                    <Settings />
                    Manage Bet Types
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-results">
                    <ClipboardList />
                    Manage Results
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-markets">
                    <Store />
                    Manage Markets
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-timings">
                    <Clock />
                    Manage Timings
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/transactions">
                    <Wallet />
                    Transactions
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/bet-ledger">
                    <Ticket />
                    Bet Ledger
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/cash-ledger">
                    <Wallet />
                    Cash Ledger
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-payments">
                    <Landmark />
                    Manage Payments
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/settings">
                    <Settings />
                    App Settings
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
                    <SidebarTrigger className="text-white"/>
                </div>
                 <div className="flex flex-1 items-center justify-end gap-2">
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-6 min-w-0 bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900">{children}</main>
            </div>
        </SidebarInset>
        </SidebarProvider>
    );
}

// THE FINAL, ULTIMATE, NO-COMPLEXITY GUARD
// This removes all custom hooks (`useUser`) and uses the raw Firebase SDK to check auth.
function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    if (!auth || !firestore) return;

    // Use Firebase's ground-truth auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, now check their role in Firestore.
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().role === 'Admin') {
          // User is an admin.
          setAuthStatus('authorized');
        } else {
          // User is not an admin or their doc doesn't exist.
          setAuthStatus('unauthorized');
        }
      } else {
        // No user is signed in.
        setAuthStatus('unauthorized');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, firestore]);

  useEffect(() => {
    // This effect handles redirection based on the final auth status.
    if (authStatus === 'unauthorized') {
      router.replace('/admin');
    }
  }, [authStatus, router]);

  // Render based on the status
  if (authStatus === 'authorized') {
    return <AdminLayoutContent>{children}</AdminLayoutContent>;
  }

  // For both 'loading' and 'unauthorized' (before redirect happens),
  // show a loading screen to prevent content flashing.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-t-transparent"></div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the main admin login page, don't use the auth layout.
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  // For all other admin pages, wrap them in our new, robust authentication layout.
  return <AdminAuthLayout>{children}</AdminAuthLayout>;
}
