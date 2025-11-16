
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Ticket } from "lucide-react";

const betTypes = [
    { name: "Open Digit", slug: "open-digit", description: "Bet on a single number from 0-9 for the Open result." },
    { name: "Close Digit", slug: "close-digit", description: "Bet on a single number from 0-9 for the Close result." },
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
       <div>
          <h1 className="text-2xl font-bold tracking-tight">Choose Bet Type</h1>
          <p className="text-muted-foreground">Market: <span className="font-semibold text-primary">{marketName}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {betTypes.map((bet) => (
          <Card key={bet.slug} className="flex flex-col justify-between">
             <CardHeader>
              <CardTitle>{bet.name}</CardTitle>
              <CardDescription>{bet.description}</CardDescription>
            </CardHeader>
            <CardFooter>
               <Button asChild className="w-full">
                <Link href={`/play/${marketSlug}/${bet.slug}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Place Bet
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
