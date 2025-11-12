"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coins } from "lucide-react";

const initialRates = [
  { game: "Single Digit", rate: "10 ka 100" },
  { game: "Jodi", rate: "10 ka 950" },
  { game: "Single Panna", rate: "10 ka 1400" },
  { game: "Double Panna", rate: "10 ka 2800" },
  { game: "Triple Panna", rate: "10 ka 7000" },
  { game: "Half Sangam", rate: "10 ka 10,000" },
  { game: "Full Sangam", rate: "10 ka 1,00,000" },
];

export default function SettingsPage() {
    const { toast } = useToast();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved",
            description: "The game rates have been updated successfully.",
        });
    }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            <span>Manage Game Rates</span>
          </CardTitle>
          <CardDescription>Update the payout rates for different game types.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {initialRates.map((rate, index) => (
              <div key={index} className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor={`rate-${index}`}>{rate.game}</Label>
                <Input id={`rate-${index}`} defaultValue={rate.rate} />
              </div>
            ))}
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
