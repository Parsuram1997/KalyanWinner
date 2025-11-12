
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

const gameTypes = [
  "Open Single",
  "Close Single",
  "Jodi",
  "Open Panna",
  "Close Panna",
  "Half Sangam",
  "Full Sangam",
];

function BetForm({
  gameType,
  market,
}: {
  gameType: string;
  market: string;
}) {
  const { toast } = useToast();
  const [digit, setDigit] = useState("");
  const [points, setPoints] = useState("");
  const [digit2, setDigit2] = useState(""); // For sangam

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!digit || !points) {
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: "Please enter all required fields and points.",
      });
      return;
    }
     if ((gameType === "Half Sangam" || gameType === "Full Sangam") && !digit2) {
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: "Please enter both numbers for Sangam.",
      });
      return;
    }

    let betDescription = `Your bet of ${points} points on ${digit}`;
    if (gameType === "Half Sangam" || gameType === "Full Sangam") {
        betDescription += ` - ${digit2}`;
    }
    betDescription += ` for ${gameType} (${market}) has been placed.`;

    toast({
      title: "Bet Placed!",
      description: betDescription,
    });
    setDigit("");
    setPoints("");
    setDigit2("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{gameType} Bet</CardTitle>
          <CardDescription>
            Enter your desired number and the points to bet for {market}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${market}-${gameType}-digit`}>
              {gameType === "Jodi" ? "Jodi" : gameType.includes("Panna") ? "Panna" : gameType.includes("Sangam") ? "Number 1" : "Digit"}
            </Label>
            <Input
              id={`${market}-${gameType}-digit`}
              placeholder={getPlaceholder()}
              value={digit}
              onChange={(e) => setDigit(e.target.value)}
            />
          </div>
           {(gameType === "Half Sangam" || gameType === "Full Sangam") && (
            <div className="space-y-2">
              <Label htmlFor={`${market}-${gameType}-digit2`}>Number 2</Label>
              <Input
                id={`${market}-${gameType}-digit2`}
                placeholder={getPlaceholder2()}
                value={digit2}
                onChange={(e) => setDigit2(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={`${market}-${gameType}-points`}>Points</Label>
            <Input
              id={`${market}-${gameType}-points`}
              type="number"
              placeholder="e.g., 10"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
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
  );
}

const GameTypeTabs = ({ market }: { market: string }) => (
  <Tabs defaultValue={gameTypes[0]} className="w-full">
    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
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
    </div>
  );
}
