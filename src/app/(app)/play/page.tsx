
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
import { Textarea } from "@/components/ui/textarea";
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
  const [digits, setDigits] = useState("");
  const [points, setPoints] = useState("");
  const [digit2, setDigit2] = useState(""); // For sangam

  const getPlaceholder = () => {
    const isMulti = !gameType.includes("Sangam");
    let example = "";
    switch (gameType) {
      case "Jodi":
        example = "45";
        break;
      case "Open Panna":
      case "Close Panna":
        example = "128";
        break;
      case "Half Sangam":
        return "Open Panna / Close Digit";
      case "Full Sangam":
        return "Open Panna";
      default:
        example = "8";
        break;
    }
    if (isMulti) {
      return `e.g.,\n${example}\n${parseInt(example) + 1}\n${
        parseInt(example) + 2
      }`;
    }
    return `e.g., ${example}`;
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
    const numbers = digits.split("\n").filter((n) => n.trim() !== "");

    if (numbers.length === 0 || !points) {
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: "Please enter at least one number and the points.",
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
     if (numbers.length > 1 && gameType.includes("Sangam")) {
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: "Only a single bet is allowed for Half Sangam or Full Sangam.",
      });
      return;
    }

    const totalPoints = numbers.length * parseInt(points);
    let betDescription = `Your bet of ${points} points on ${numbers.join(
      ", "
    )} for ${gameType} (${market}) has been placed.`;
     if (gameType === "Half Sangam" || gameType === "Full Sangam") {
        betDescription = `Your bet of ${points} points on ${digits} - ${digit2} for ${gameType} (${market}) has been placed.`;
    }


    toast({
      title: "Bet Placed!",
      description: betDescription,
      footer: `Total Points: ${totalPoints}`,
    });
    setDigits("");
    setPoints("");
    setDigit2("");
  };
  
  const isSangam = gameType.includes("Sangam");


  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{gameType} Bet</CardTitle>
          <CardDescription>
            {isSangam
              ? `Enter your numbers and points for ${market}.`
              : `Enter one number per line. The same point value will be applied to each.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${market}-${gameType}-digit`}>
              {gameType === "Jodi"
                ? "Jodi Number(s)"
                : gameType.includes("Panna")
                ? "Panna Number(s)"
                : gameType.includes("Sangam")
                ? "Number 1"
                : "Digit(s)"}
            </Label>
            {isSangam ? (
              <Input
              id={`${market}-${gameType}-digit`}
              placeholder={getPlaceholder()}
              value={digits}
              onChange={(e) => setDigits(e.target.value)}
            />
            ) : (
            <Textarea
              id={`${market}-${gameType}-digit`}
              placeholder={getPlaceholder()}
              value={digits}
              onChange={(e) => setDigits(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
            )}
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
            <Label htmlFor={`${market}-${gameType}-points`}>
              Points (per number)
            </Label>
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
