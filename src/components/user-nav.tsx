
"use client";

import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "./ui/sidebar";
import { cn } from "@/lib/utils";
import { LogOut, User as UserIcon, ChevronsUpDown } from "lucide-react";


export function UserNav() {
  const { open } = useSidebar();
  
  if (!open) {
    return (
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://picsum.photos/seed/1/40/40" alt="@shadcn" data-ai-hint="profile picture" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="right" align="start" forceMount>
          <DropdownMenuLabel className="font-normal">
             <div className="flex flex-col items-center space-y-2 py-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="https://picsum.photos/seed/1/40/40" alt="@shadcn" data-ai-hint="profile picture" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              <p className="text-sm font-medium leading-none">Username</p>
              <p className="text-xs leading-none text-muted-foreground">
                user@example.com
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/login"><LogOut className="mr-2"/>Log out</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-12 w-12">
          <AvatarImage src="https://picsum.photos/seed/1/40/40" alt="@shadcn" data-ai-hint="profile picture" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium leading-none mt-2">Username</p>
        <p className="text-xs leading-none text-muted-foreground mt-1">
          user@example.com
        </p>
      </div>
      <Button variant="ghost" className="w-full justify-center" asChild>
        <Link href="/login"><LogOut className="mr-2"/>Log out</Link>
      </Button>
    </div>
  );
}

