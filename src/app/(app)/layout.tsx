"use client"
import Link from "next/link";
import {
  BrainCircuit,
  ClipboardList,
  GanttChartSquare,
  LayoutDashboard,
  Wallet,
  Coins,
  AreaChart,
  TableProperties,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const market = searchParams.get('market');

  if (pathname.startsWith('/admin')) {
    return null;
  }

  if (pathname !== '/play') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" asChild>
          <Link href="/play?market=kalyan-day">
            <GanttChartSquare className="mr-2 h-5 w-5" />
            Kalyan Day
          </Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/play?market=kalyan-night">
            <GanttChartSquare className="mr-2 h-5 w-5" />
            Kalyan Night
          </Link>
        </Button>
      </div>
    )
  }

  const isDayActive = market === 'kalyan-day';
  const isNightActive = market === 'kalyan-night';

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button size="lg" variant={isDayActive ? 'default' : 'secondary'} asChild>
        <Link href="/play?market=kalyan-day">
          <GanttChartSquare className="mr-2 h-5 w-5" />
          Kalyan Day
        </Link>
      </Button>
      <Button size="lg" variant={isNightActive ? 'default' : 'secondary'} asChild>
        <Link href="/play?market=kalyan-night">
          <GanttChartSquare className="mr-2 h-5 w-5" />
          Kalyan Night
        </Link>
      </Button>
    </div>
  )
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-start">
            <h1 className="text-lg font-semibold tracking-tight text-primary">
              Kalyan Winner
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard">
                  <LayoutDashboard />
                  Dashboard
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
                <Link href="/play">
                  <GanttChartSquare />
                  Play
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
                  <TableProperties />
                  Panel Chart
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
                <Link href="/analysis">
                  <BrainCircuit />
                  AI Analysis
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-dvh">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Breadcrumbs or page title can go here */}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserNav />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
          <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 p-2 backdrop-blur-sm md:hidden">
              <BottomNav />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
