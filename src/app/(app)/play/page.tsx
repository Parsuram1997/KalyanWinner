
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
import { PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const gameTypes = [
  "Open Single",
  "Close Single",
  "Jodi",
  "Open Panna",
  "Close Panna",
  "Half Sangam",
  "Full Sangam",
];

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

  // State for Sangam bets (since they are different)
  const [sangamNumber1, setSangamNumber1] = useState("");
  const [sangamNumber2, setSangamNumber2] = useState("");
  const [sangamAmount, setSangamAmount] = useState("");

  const isSangam = gameType.includes("Sangam");

  const getPlaceholder = () => {
    switch (gameType) {
      case "Jodi":
        return "e.g., 45";
      case "Open Panna":
      case "Close Panna":
        return "e.g., 128";
      case "Half Sangam":
        return "Open Panna / Close Digit";
      case "Full Sangam":
        return "Open Panna";
      default:
        return "e.g., 8";
    }
  };

  const getPlaceholder2 = () => {
    switch (gameType) {
      case "Half Sangam":
        return "Close Digit / Open Digit";
      case "Full Sangam":
        return "Close Panna";
      default:
        return "";
    }
  };
  
  const validateBet = (number: string, amount: string) => {
    if (!number || !amount) {
        toast({ variant: "destructive", title: "Invalid Bet", description: "Please enter both a number and amount." });
        return false;
    }
    if(parseInt(amount) <= 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "Amount must be greater than zero." });
        return false;
    }
    if (gameType.includes("Single")) {
        if (!/^\d$/.test(number)) {
            toast({ variant: "destructive", title: "Invalid Number", description: "Single digit must be a single digit (0-9)." });
            return false;
        }
    } else if (gameType === "Jodi") {
        if (!/^\d{2}$/.test(number)) {
            toast({ variant: "destructive", title: "Invalid Number", description: "Jodi must be two digits (00-99)." });
            return false;
        }
    } else if (gameType.includes("Panna")) {
        if (!/^\d{3}$/.test(number)) {
            toast({ variant: "destructive", title: "Invalid Number", description: "Panna must be three digits (000-999)." });
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

    if (isSangam) {
        let isValid = true;
        if (!sangamNumber1 || !sangamNumber2 || !sangamAmount) {
            toast({ variant: "destructive", title: "Invalid Sangam Bet", description: "Please fill out all fields." });
            isValid = false;
        }
        if (parseInt(sangamAmount) <= 0) {
            toast({ variant: "destructive", title: "Invalid Amount", description: "Amount must be greater than zero." });
            isValid = false;
        }

        if (gameType === "Half Sangam") {
            if (!((/^\d{3}$/.test(sangamNumber1) && /^\d$/.test(sangamNumber2)) || (/^\d$/.test(sangamNumber1) && /^\d{3}$/.test(sangamNumber2)))) {
                 toast({ variant: "destructive", title: "Invalid Half Sangam", description: "Half Sangam requires one Panna (3 digits) and one Single Digit." });
                 isValid = false;
            }
        } else if (gameType === "Full Sangam") {
            if (!/^\d{3}$/.test(sangamNumber1) || !/^\d{3}$/.test(sangamNumber2)) {
                toast({ variant: "destructive", title: "Invalid Full Sangam", description: "Full Sangam requires two Pannas (3 digits each)." });
                isValid = false;
            }
        }

        if (!isValid) return;

        toast({
            title: "Bet Placed!",
            description: `Your bet of ${sangamAmount} on ${sangamNumber1} - ${sangamNumber2} for ${gameType} (${market}) has been placed.`,
        });
        setSangamNumber1("");
        setSangamNumber2("");
        setSangamAmount("");
    } else {
      if (bets.length === 0) {
        toast({
          variant: "destructive",
          title: "No Bets Added",
          description: "Please add at least one bet before placing.",
        });
        return;
      }

      const totalAmount = bets.reduce((sum, bet) => sum + parseInt(bet.amount), 0);
      const betDescriptions = bets.map(b => `${b.number} (${b.amount} amt)`).join(', ');

      toast({
        title: "Bets Placed!",
        description: `Your bets for ${gameType} (${market}) have been placed: ${betDescriptions}`,
        footer: `Total Amount: ${totalAmount}`,
      });
      setBets([]);
    }
  };
  

  if (isSangam) {
    return (
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{gameType} Bet</CardTitle>
            <CardDescription>
              Enter your numbers and amount for the {market} market.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor={`${market}-${gameType}-num1`}>{gameType === 'Half Sangam' ? 'Panna / Digit' : 'Open Panna'}</Label>
                <Input
                  id={`${market}-${gameType}-num1`}
                  placeholder={getPlaceholder()}
                  value={sangamNumber1}
                  onChange={(e) => setSangamNumber1(e.target.value)}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor={`${market}-${gameType}-num2`}>{gameType === 'Half Sangam' ? 'Digit / Panna' : 'Close Panna'}</Label>
                <Input
                  id={`${market}-${gameType}-num2`}
                  placeholder={getPlaceholder2()}
                  value={sangamNumber2}
                  onChange={(e) => setSangamNumber2(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${market}-${gameType}-amount`}>Amount</Label>
                <Input
                  id={`${market}-${gameType}-amount`}
                  type="number"
                  placeholder="e.g., 10"
                  value={sangamAmount}
                  onChange={(e) => setSangamAmount(e.target.value)}
                />
              </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Place Bet
            </Button>
          </CardFooter>
        </Card>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{gameType} Bet</CardTitle>
          <CardDescription>
            Add multiple bets and place them all at once for the {market} market.
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
                <Button type="button" size="icon" onClick={handleAddBet} className="shrink-0">
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">Add Bet</span>
                </Button>
            </div>
            
            {bets.length > 0 && (
                <div className="space-y-2 rounded-lg border p-3">
                    <h4 className="text-sm font-medium">Your Bets</h4>
                     <div className="flex flex-col gap-2">
                      {bets.map((bet, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 text-sm">
                           <div className="flex items-center gap-2">
                             <Badge variant="secondary" className="font-mono">{bet.number}</Badge>
                             <span>{bet.amount} Amount</span>
                           </div>
                           <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveBet(index)}>
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
          <Button type="submit" className="w-full" disabled={bets.length === 0}>
            Place All Bets ({bets.length})
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

const GameTypeTabs = ({ market }: { market: string }) => (
  <Tabs defaultValue={gameTypes[0]} className="w-full">
    <TabsList className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 h-auto">
      {gameTypes.map((type) => (
        <TabsTrigger key={type} value={type} className="text-xs px-2">
          {type}
        </TabsTrigger>
      ))}
    </TabsList>
    {gameTypes.map((type) => (
      <TabsContent key={type} value={type}>
        <BetForm gameType={type} market={market} />
      </TabsContent>
    ))}
  </Tabs>
);

export default function PlayPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Place Your Bet</h1>
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
