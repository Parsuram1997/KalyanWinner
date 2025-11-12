
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
  points: string;
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
  const [currentPoints, setCurrentPoints] = useState("");

  // State for Sangam bets (since they are different)
  const [sangamNumber1, setSangamNumber1] = useState("");
  const [sangamNumber2, setSangamNumber2] = useState("");
  const [sangamPoints, setSangamPoints] = useState("");

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
  
  const handleAddBet = () => {
    if (!currentNumber || !currentPoints) {
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: "Please enter both a number and points.",
      });
      return;
    }
    setBets([...bets, { number: currentNumber, points: currentPoints }]);
    setCurrentNumber("");
    setCurrentPoints("");
  };

  const handleRemoveBet = (index: number) => {
    const newBets = bets.filter((_, i) => i !== index);
    setBets(newBets);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSangam) {
      if (!sangamNumber1 || !sangamNumber2 || !sangamPoints) {
        toast({
          variant: "destructive",
          title: "Invalid Sangam Bet",
          description: "Please fill out all fields for the Sangam bet.",
        });
        return;
      }
      toast({
        title: "Bet Placed!",
        description: `Your bet of ${sangamPoints} points on ${sangamNumber1} - ${sangamNumber2} for ${gameType} (${market}) has been placed.`,
        footer: `Total Points: ${sangamPoints}`,
      });
      setSangamNumber1("");
      setSangamNumber2("");
      setSangamPoints("");
    } else {
      if (bets.length === 0) {
        toast({
          variant: "destructive",
          title: "No Bets Added",
          description: "Please add at least one bet before placing.",
        });
        return;
      }

      const totalPoints = bets.reduce((sum, bet) => sum + parseInt(bet.points), 0);
      const betDescriptions = bets.map(b => `${b.number} (${b.points} pts)`).join(', ');

      toast({
        title: "Bets Placed!",
        description: `Your bets for ${gameType} (${market}) have been placed: ${betDescriptions}`,
        footer: `Total Points: ${totalPoints}`,
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
              Enter your numbers and points for the {market} market.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor={`${market}-${gameType}-num1`}>Number 1</Label>
                <Input
                  id={`${market}-${gameType}-num1`}
                  placeholder={getPlaceholder()}
                  value={sangamNumber1}
                  onChange={(e) => setSangamNumber1(e.target.value)}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor={`${market}-${gameType}-num2`}>Number 2</Label>
                <Input
                  id={`${market}-${gameType}-num2`}
                  placeholder={getPlaceholder2()}
                  value={sangamNumber2}
                  onChange={(e) => setSangamNumber2(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${market}-${gameType}-points`}>Points</Label>
                <Input
                  id={`${market}-${gameType}-points`}
                  type="number"
                  placeholder="e.g., 10"
                  value={sangamPoints}
                  onChange={(e) => setSangamPoints(e.target.value)}
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
                    <Label htmlFor={`${market}-${gameType}-points`}>Points</Label>
                    <Input
                      id={`${market}-${gameType}-points`}
                      type="number"
                      placeholder="e.g., 10"
                      value={currentPoints}
                      onChange={(e) => setCurrentPoints(e.target.value)}
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
                             <span>{bet.points} Points</span>
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
