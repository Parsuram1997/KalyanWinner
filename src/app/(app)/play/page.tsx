
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { PlusCircle, Trash2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const gameTypesRow1 = ["Open Single", "Jodi", "Close Single"];
const gameTypesRow2 = ["Open Panna", "Close Panna"];
const allGameTypes = [...gameTypesRow1, ...gameTypesRow2];

type Bet = {
  number: string;
  amount: string;
};

function BetForm({
  gameType,
  market,
}: {
  gameType: string;
  market: string;
}) {
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [currentNumber, setCurrentNumber] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");

  const getPlaceholder = () => {
    switch (gameType) {
      case "Jodi":
        return "e.g., 45";
      case "Open Panna":
      case "Close Panna":
        return "e.g., 128";
      default:
        return "e.g., 8";
    }
  };

  const validateBet = (number: string, amount: string) => {
    if (!number || !amount) {
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: "Please enter both a number and amount.",
      });
      return false;
    }
    const amountInt = parseInt(amount);
    if (amountInt <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Amount must be greater than zero.",
      });
      return false;
    }
    if (amountInt % 5 !== 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Amount must be a multiple of 5.",
      });
      return false;
    }
    if (gameType.includes("Single")) {
      if (!/^\d$/.test(number)) {
        toast({
          variant: "destructive",
          title: "Invalid Number",
          description: "Single digit must be a single digit (0-9).",
        });
        return false;
      }
    } else if (gameType === "Jodi") {
      if (!/^\d{2}$/.test(number)) {
        toast({
          variant: "destructive",
          title: "Invalid Number",
          description: "Jodi must be two digits (00-99).",
        });
        return false;
      }
    } else if (gameType.includes("Panna")) {
      if (!/^\d{3}$/.test(number)) {
        toast({
          variant: "destructive",
          title: "Invalid Number",
          description: "Panna must be three digits (000-999).",
        });
        return false;
      }
    }
    return true;
  };

  const handleAddBet = () => {
    if (!validateBet(currentNumber, currentAmount)) return;

    setBets([...bets, { number: currentNumber, amount: currentAmount }]);
    setCurrentNumber("");
    setCurrentAmount("");
  };

  const handleRemoveBet = (index: number) => {
    const newBets = bets.filter((_, i) => i !== index);
    setBets(newBets);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (bets.length === 0) {
      toast({
        variant: "destructive",
        title: "No Bets Added",
        description: "Please add at least one bet before placing.",
      });
      return;
    }

    const totalAmount = bets.reduce(
      (sum, bet) => sum + parseInt(bet.amount),
      0
    );
    const betDescriptions = bets
      .map((b) => `${b.number} (${b.amount} amt)`)
      .join(", ");

    toast({
      title: "Bets Placed!",
      description: `Your bets for ${gameType} (${market}) have been placed: ${betDescriptions}`,
    });
    setBets([]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{gameType} Bet</CardTitle>
          <CardDescription>
            Add multiple bets and place them all at once for the {market}{" "}
            market.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`${market}-${gameType}-digit`}>
                {gameType === "Jodi"
                  ? "Jodi Number"
                  : gameType.includes("Panna")
                  ? "Panna Number"
                  : "Digit"}
              </Label>
              <Input
                id={`${market}-${gameType}-digit`}
                placeholder={getPlaceholder()}
                value={currentNumber}
                onChange={(e) => setCurrentNumber(e.target.value)}
              />
            </div>
            <div className="w-28 space-y-2">
              <Label htmlFor={`${market}-${gameType}-amount`}>Amount</Label>
              <Input
                id={`${market}-${gameType}-amount`}
                type="number"
                placeholder="e.g., 10"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="icon"
              onClick={handleAddBet}
              className="shrink-0"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Add Bet</span>
            </Button>
          </div>

          {bets.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              <h4 className="text-sm font-medium">Your Bets</h4>
              <div className="flex flex-col gap-2">
                {bets.map((bet, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {bet.number}
                      </Badge>
                      <span>{bet.amount} Amount</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveBet(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove bet</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={bets.length === 0}
          >
            Place All Bets ({bets.length})
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

const GameTypeTabs = ({ market }: { market: string }) => (
  <Tabs defaultValue={allGameTypes[0]} className="w-full">
    <div className="flex flex-col gap-1">
      <TabsList className="grid grid-cols-3 h-auto">
        {gameTypesRow1.map((type) => (
          <TabsTrigger key={type} value={type} className="text-xs px-2">
            {type}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsList className="grid grid-cols-2 h-auto">
        {gameTypesRow2.map((type) => (
          <TabsTrigger key={type} value={type} className="text-xs px-2">
            {type}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
    {allGameTypes.map((type) => (
      <TabsContent key={type} value={type}>
        <BetForm gameType={type} market={market} />
      </TabsContent>
    ))}
  </Tabs>
);

export default function PlayPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Place Your Bet</h1>
          <p className="text-muted-foreground">Select a market and game type to start.</p>
        </div>
        <Card className="w-fit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">₹1,245.50</div>
          </CardContent>
          <CardFooter className="pt-0">
             <Button variant="outline" size="xs" asChild>
              <Link href="/wallet">Manage Funds</Link>
             </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Market</CardTitle>
          <CardDescription>
            Choose between the Kalyan Day and Kalyan Night markets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="kalyan-day" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="kalyan-day">Kalyan Day</TabsTrigger>
              <TabsTrigger value="kalyan-night">Kalyan Night</TabsTrigger>
            </TabsList>
            <TabsContent value="kalyan-day">
              <GameTypeTabs market="Kalyan Day" />
            </TabsContent>
            <TabsContent value="kalyan-night">
              <GameTypeTabs market="Kalyan Night" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
