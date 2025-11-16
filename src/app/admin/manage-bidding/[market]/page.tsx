
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Ticket } from "lucide-react";

const betTypes = [
    { name: "Open Digit", slug: "open-digit", description: "Bids for the Open result digit." },
    { name: "Close Digit", slug: "close-digit", description: "Bids for the Close result digit." },
    { name: "Jodi", slug: "jodi", description: "Bids for the two-digit Jodi number." },
    { name: "Single Panna", slug: "single-panna", description: "Bids for the Single Panna." },
    { name: "Double Panna", slug: "double-panna", description: "Bids for the Double Panna." },
    { name: "Triple Panna", slug: "triple-panna", description: "Bids for the Triple Panna." },
];

export default function ChooseBiddingTypePage() {
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
                <Link href={`/admin/manage-bidding/${marketSlug}/${bet.slug}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  View Bids
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
