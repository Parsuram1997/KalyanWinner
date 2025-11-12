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

const gameTypes = ["Single Digit", "Jodi", "Single Panna", "Double Panna"];

function BetForm({ gameType }: { gameType: string }) {
  const { toast } = useToast();
  const [digit, setDigit] = useState("");
  const [points, setPoints] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!digit || !points) {
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: "Please enter both digit and points.",
      });
      return;
    }
    toast({
      title: "Bet Placed!",
      description: `Your bet of ${points} points on ${digit} for ${gameType} has been placed.`,
    });
    setDigit("");
    setPoints("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{gameType} Bet</CardTitle>
          <CardDescription>
            Enter your desired number and the points to bet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="digit">Digit / Jodi / Panna</Label>
            <Input
              id="digit"
              placeholder={
                gameType === "Jodi"
                  ? "e.g., 45"
                  : gameType.includes("Panna")
                  ? "e.g., 128"
                  : "e.g., 8"
              }
              value={digit}
              onChange={(e) => setDigit(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
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

export default function PlayPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Place Your Bet</h1>
      <Tabs defaultValue={gameTypes[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          {gameTypes.map((type) => (
            <TabsTrigger key={type} value={type}>
              {type}
            </TabsTrigger>
          ))}
        </TabsList>
        {gameTypes.map((type) => (
          <TabsContent key={type} value={type}>
            <BetForm gameType={type} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
