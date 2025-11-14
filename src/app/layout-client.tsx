
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Coins,
  GanttChartSquare,
  Home,
  LineChart,
  ListOrdered,
  BarChart,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ThemeToggle } from "@/components/theme-toggle";

const bottomNavItems = [
  { href: "/play?market=kalyan-day", label: "Kalyan Day" },
  { href: "/play?market=kalyan-night", label: "Kalyan Night" },
];

const BottomNav = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams()?.get('market');

  if (pathname !== "/play") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 block border-t bg-background/80 backdrop-blur-sm md:hidden">
      <div className="grid h-16 grid-cols-2 gap-2 p-2">
        {bottomNavItems.map((item) => {
          const market = item.label.split(" ").join("-").toLowerCase();
          const isActive =
            pathname === "/play" && searchParams === market;
          return (
            <Button
              key={item.label}
              asChild
              variant={isActive ? "default" : "secondary"}
              className="h-full text-base"
            >
              <Link href={item.href}>
                <GanttChartSquare className="mr-2 h-5 w-5" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-start gap-2">
            <Coins className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight text-primary">
              Kalyan Winner
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard">
                  <Home />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/play">
                  <GanttChartSquare />
                  Play
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/results">
                  <ListOrdered />
                  Results
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/panel-chart">
                  <BarChart />
                  Panel Chart
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/rates">
                  <Coins />
                  Rates
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
                <Link href="/analysis">
                  <LineChart />
                  AI Analysis
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-dvh">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
               <h1 className="text-lg font-semibold">Kalyan Winner</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
          <BottomNav />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
