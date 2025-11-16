
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const betTypes = [
    { name: "Single Digit", slug: "single-digit", description: "Bet on a single number from 0-9 for Open or Close." },
    { name: "Jodi", slug: "jodi", description: "Bet on a two-digit number from 00-99." },
    { name: "Single Panna", slug: "single-panna", description: "Bet on a three-digit number with unique digits." },
    { name: "Double Panna", slug: "double-panna", description: "Bet on a three-digit number with two identical digits." },
    { name: "Triple Panna", slug: "triple-panna", description: "Bet on a three-digit number with all identical digits." },
    { name: "Half Sangam", slug: "half-sangam", description: "Bet on a combination of one Panna and one digit." },
    { name: "Full Sangam", slug: "full-sangam", description: "Bet on the combination of both Open and Close Pannas." },
];

export default function ChooseBetTypePage() {
  const params = useParams();
  const marketSlug = params.market as string;
  const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
              <Link href="/play">
                  <ArrowLeft className="h-4 w-4" />
              </Link>
          </Button>
          <div>
              <h1 className="text-2xl font-bold tracking-tight">Choose Bet Type</h1>
              <p className="text-muted-foreground">Market: <span className="font-semibold text-primary">{marketName}</span></p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {betTypes.map((bet) => (
          <Card key={bet.slug} className="flex flex-col">
             <CardHeader>
              <CardTitle>{bet.name}</CardTitle>
              <CardDescription>{bet.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow" />
            <div className="p-6 pt-0">
               <Button asChild className="w-full" variant={bet.slug === "jodi" ? "default" : "outline"}>
                <Link href={cn("/play", marketSlug, bet.slug)}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Place Bet
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
