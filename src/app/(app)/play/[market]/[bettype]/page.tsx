
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
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { PlusCircle, Trash2, Wallet, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";

type Bet = {
  number: string;
  amount: string;
};

function BetForm({
  gameType,
  market,
  walletBalance,
}: {
  gameType: string;
  market: string;
  walletBalance: number;
}) {
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [currentNumber, setCurrentNumber] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");

  const totalBetAmount = useMemo(() => {
    return bets.reduce((sum, bet) => sum + parseInt(bet.amount || "0"), 0);
  }, [bets]);

  const getPlaceholder = () => {
    switch (gameType) {
      case "Jodi":
        return "e.g., 45";
      case "Single Panna":
      case "Double Panna":
      case "Triple Panna":
        return "e.g., 128";
      case "Half Sangam":
        return "e.g., 123 x 4";
      case "Full Sangam":
        return "e.g., 123 x 456";
      default: // Open Digit, Close Digit
        return "e.g., 8";
    }
  };

  const getLabel = () => {
    switch (gameType) {
      case "Jodi":
        return "Jodi Number";
      case "Single Panna":
      case "Double Panna":
      case "Triple Panna":
        return "Panna Number";
      case "Half Sangam":
      case "Full Sangam":
        return "Sangam Number";
      default: // Open Digit, Close Digit
        return "Digit";
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
    if (isNaN(amountInt) || amountInt <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Amount must be a positive number.",
      });
      return false;
    }

    if (amountInt % 5 !== 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Bet amount must be a multiple of 5.",
      });
      return false;
    }

    if (gameType === "Open Digit" || gameType === "Close Digit") {
      if (!/^\d$/.test(number)) {
        toast({
          variant: "destructive",
          title: "Invalid Number",
          description: "Digit must be a single digit (0-9).",
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
    } else if (gameType === "Half Sangam") {
        if (!/^\d{3}\s?x\s?\d$/.test(number)) {
            toast({
            variant: "destructive",
            title: "Invalid Number",
            description: "Half Sangam format must be 'Open Panna x Close Digit' (e.g., 123 x 4).",
            });
            return false;
        }
    } else if (gameType === "Full Sangam") {
        if (!/^\d{3}\s?x\s?\d{3}$/.test(number)) {
            toast({
            variant: "destructive",
            title: "Invalid Number",
            description: "Full Sangam format must be 'Open Panna x Close Panna' (e.g., 123 x 456).",
            });
            return false;
        }
    }
    
    // This check will be re-evaluated after we know if it's a new bet or an update
    return true;
  };

  const handleAddBet = () => {
    if (!validateBet(currentNumber, currentAmount)) return;

    const existingBetIndex = bets.findIndex(bet => bet.number === currentNumber);
    const amountInt = parseInt(currentAmount);

    let newTotalAmount = totalBetAmount;
    
    if (existingBetIndex !== -1) {
        // Bet exists, calculate the difference in amount
        const oldAmount = parseInt(bets[existingBetIndex].amount);
        newTotalAmount = totalBetAmount - oldAmount + amountInt;
    } else {
        // New bet
        newTotalAmount = totalBetAmount + amountInt;
    }

    if (newTotalAmount > walletBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `Your total bet of ₹${newTotalAmount} exceeds your wallet balance.`,
      });
      return;
    }

    if (existingBetIndex !== -1) {
        // Update existing bet
        const newBets = [...bets];
        newBets[existingBetIndex].amount = currentAmount;
        setBets(newBets);
        toast({
            title: `Bet Updated: ${currentNumber}`,
            description: `Amount changed to ₹${currentAmount}.`,
        });
    } else {
        // Add new bet
        setBets([...bets, { number: currentNumber, amount: currentAmount }]);
    }
    
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

    if (totalBetAmount > walletBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "Total bet amount exceeds your wallet balance.",
      });
      return;
    }

    const betDescriptions = bets
      .map((b) => `${b.number} (₹${b.amount})`)
      .join(", ");

    toast({
      title: "Bets Placed!",
      description: `Your bets for ${gameType} (${market}) totaling ₹${totalBetAmount} have been placed.`,
    });
    setBets([]);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
            <CardHeader>
            <CardTitle>{gameType} Bet</CardTitle>
            <CardDescription>
                Add bets and place them for the {market} market.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                <Label htmlFor={`${market}-${gameType}-digit`}>
                    {getLabel()}
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
                <div className="space-y-3 rounded-lg border p-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Your Bets</h4>
                        <div className="text-xs font-mono text-muted-foreground text-right">
                        <div>Total: ₹{totalBetAmount}</div>
                        <div className="text-green-600">Remaining: ₹{(walletBalance - totalBetAmount).toFixed(2)}</div>
                        </div>
                    </div>
                    <Separator />
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
                            <span>₹{bet.amount}</span>
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
                Place Bets for {gameType} (Total: ₹{totalBetAmount})
            </Button>
            </CardFooter>
        </form>
    </Card>
  );
}

const WalletCard = ({ balance }: { balance: number }) => (
    <Card className="bg-gradient-to-br from-primary/20 to-accent/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold">₹{balance.toFixed(2)}</div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Button size="sm" asChild>
                <Link href="/wallet">
                    <Wallet className="mr-1.5 h-4 w-4" /> Manage Funds
                </Link>
            </Button>
        </CardFooter>
    </Card>
);

export default function PlaceBetPage() {
  const params = useParams();
  const marketSlug = params.market as string;
  const betTypeSlug = params.bettype as string;
  
  const betTypeName = betTypeSlug.split('-').map(word => {
    if (word.toLowerCase() === 'panna') return 'Panna';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
  const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // In a real app, this would come from a user context or API
  const walletBalance = 1245.5;

  return (
    <div className="flex flex-col gap-6">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-4 sm:hidden">
        <WalletCard balance={walletBalance} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Place Bet</h1>
          <p className="text-muted-foreground">
            Market: <span className="font-semibold text-primary">{marketName}</span>
          </p>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-4 items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Place Bet</h1>
          <p className="text-muted-foreground">
            Market: <span className="font-semibold text-primary">{marketName}</span>
          </p>
        </div>
        <div className="sm:justify-self-end">
            <WalletCard balance={walletBalance} />
        </div>
      </div>

      <BetForm gameType={betTypeName} market={marketName} walletBalance={walletBalance} />
    </div>
  );
}
