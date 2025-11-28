
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
import { toast } from "@/hooks/use-toast";
import { useState, useMemo, ChangeEvent, useRef, useEffect } from "react";
import { PlusCircle, Trash2, Wallet, DollarSign, Loader, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, writeBatch, serverTimestamp, FieldValue, increment, collection, query, where, limit, getDocs, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


type Bet = {
  number: string;
  amount: string;
};

// ====================================================================\
// START: Specialized Form Components
// ====================================================================\

// Form for Single Digit, Jodi, Single/Double/Triple Panna
const SingleInputForm = ({
  label,
  maxLength,
  onAddBet,
}: {
  label: string;
  maxLength: number;
  onAddBet: (bet: Bet) => void;
}) => {
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const numberRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    numberRef.current?.focus();
  }, []);

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setNumber(value);
    if (value.length === maxLength) {
      amountRef.current?.focus();
    }
  }

  const handleAdd = () => {
    onAddBet({ number, amount });
    setNumber("");
    setAmount("");
    numberRef.current?.focus();
  };

  return (
    <>
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          ref={numberRef}
          value={number}
          onChange={handleNumberChange}
          maxLength={maxLength}
          type="text"
          inputMode="numeric"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bet-amount-single">Amount</Label>
        <Input
          id="bet-amount-single"
          ref={amountRef}
          type="number"
          placeholder="e.g., 10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <Button type="button" className="w-full" onClick={handleAdd}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Bet
      </Button>
    </>
  );
};

// Form for Close Sangam and Full Sangam
const TwoPartInputForm = ({
  label1,
  len1,
  label2,
  len2,
  onAddBet,
}: {
  label1: string;
  len1: number;
  label2: string;
  len2: number;
  onAddBet: (bet: Bet) => void;
}) => {
  const [number1, setNumber1] = useState("");
  const [number2, setNumber2] = useState("");
  const [amount, setAmount] = useState("");
  const number1Ref = useRef<HTMLInputElement>(null);
  const number2Ref = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    number1Ref.current?.focus();
  }, []);

  const handleNumber1Change = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setNumber1(value);
    if (value.length === len1) {
      number2Ref.current?.focus();
    }
  }
  
  const handleNumber2Change = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setNumber2(value);
    if (value.length === len2) {
      amountRef.current?.focus();
    }
  }

  const handleAdd = () => {
    onAddBet({ number: `${number1}x${number2}`, amount });
    setNumber1("");
    setNumber2("");
    setAmount("");
    number1Ref.current?.focus();
  };

  return (
    <>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label>{label1}</Label>
          <Input
            ref={number1Ref}
            value={number1}
            onChange={handleNumber1Change}
            maxLength={len1}
            type="text"
            inputMode="numeric"
            autoFocus
          />
        </div>
        <span className="pb-2 font-bold text-muted-foreground">x</span>
        <div className="flex-1">
          <Label>{label2}</Label>
          <Input
            ref={number2Ref}
            value={number2}
            onChange={handleNumber2Change}
            maxLength={len2}
            type="text"
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bet-amount-multi">Amount</Label>
        <Input
          id="bet-amount-multi"
          ref={amountRef}
          type="number"
          placeholder="e.g., 10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <Button type="button" className="w-full" onClick={handleAdd}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Bet
      </Button>
    </>
  );
};

// ====================================================================\
// END: Specialized Form Components
// ====================================================================\


function BetForm({
  betTypeName,
  market,
  onBetsChange,
}: {
  betTypeName: string;
  market: string;
  onBetsChange: (bet: Bet) => void;
}) {
  
  const handleAddBet = (bet: Bet) => {
     if (!bet.number || !bet.amount) {
        toast({ variant: "destructive", title: "Invalid Bet", description: "Please fill all fields." });
        return;
    }
    if (parseInt(bet.amount) % 5 !== 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "Amount must be a multiple of 5." });
        return;
    }
    onBetsChange(bet);
  };

  const renderForm = () => {
    switch (betTypeName) {
      case 'Open Sangam':
        return <TwoPartInputForm label1="Open Panna" len1={3} label2="Close Digit" len2={1} onAddBet={handleAddBet} />;
      case 'Close Sangam':
        return <TwoPartInputForm label1="Open Digit" len1={1} label2="Close Panna" len2={3} onAddBet={handleAddBet} />;
      case 'Full Sangam':
        return <TwoPartInputForm label1="Open Panna" len1={3} label2="Close Panna" len2={3} onAddBet={handleAddBet} />;
      case 'Single Panna':
      case 'Double Panna':
      case 'Triple Panna':
        return <SingleInputForm label="Enter Panna" maxLength={3} onAddBet={handleAddBet} />;
      case 'Jodi':
        return <SingleInputForm label="Enter Jodi" maxLength={2} onAddBet={handleAddBet} />;
      case 'Open':
      case 'Close':
        return <SingleInputForm label="Enter Digit" maxLength={1} onAddBet={handleAddBet} />;
      default: // Fallback for any other type, assuming single digit
        return <SingleInputForm label="Enter Digit" maxLength={1} onAddBet={handleAddBet} />;
    }
  };


  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>{betTypeName}</CardTitle>
        <CardDescription>
          Add bets for the <span className="font-bold text-lg text-primary">{market}</span> market.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        {renderForm()}
      </CardContent>
    </Card>
  );
}

const WalletCard = ({ depositBalance, winningBalance, isLoading }: { depositBalance: number, winningBalance: number, isLoading: boolean }) => (
    <Card className="bg-gradient-to-br from-primary/20 to-accent/20 h-full flex flex-col">
        <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Wallet Balance</span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 text-xs space-y-2 flex-grow">
            {isLoading ? 
            <>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-6 w-32 mt-1" />
            </>
             : 
            <>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit:</span>
                    <span className="font-semibold">₹{depositBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Winnings:</span>
                    <span className="font-semibold">₹{winningBalance.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-base">₹{(depositBalance + winningBalance).toFixed(2)}</span>
                </div>
            </>
            }
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
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();
  const marketSlug = params.market as string;
  const betTypeSlug = params.bettype as string;

  const [bets, setBets] = useState<Bet[]>([]);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [marketDetails, setMarketDetails] = useState<any>(null);
  const [buttonState, setButtonState] = useState({ text: 'Place Bets', disabled: true, loading: true });

  const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  const betTypeName = useMemo(() => {
    const slugToNameMap: { [key: string]: string } = {
      'single-digit': 'Single Digit',
      'jodi': 'Jodi',
      'single-panna': 'Single Panna',
      'double-panna': 'Double Panna',
      'triple-panna': 'Triple Panna',
      'open-sangam': 'Open Sangam',
      'close-sangam': 'Close Sangam',
      'full-sangam': 'Full Sangam',
      'open': 'Open',
      'close': 'Close',
    };
    return slugToNameMap[betTypeSlug] || betTypeSlug.replace(/-/g, ' ');
  }, [betTypeSlug]);

  useEffect(() => {
    if (!firestore || !marketName) return;

    const fetchMarketDetails = async () => {
        const q = query(collection(firestore, "markets"), where("name", "==", marketName), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            setMarketDetails(snapshot.docs[0].data());
        }
    };
    fetchMarketDetails();
  }, [firestore, marketName]);
  
  const totalBetAmount = useMemo(() => {
    return bets.reduce((sum, bet) => sum + parseInt(bet.amount || "0"), 0);
  }, [bets]);

  useEffect(() => {
    if (!marketDetails) return;

    const parseTime = (timeStr: string) => {
        if (!timeStr) return new Date(0);
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const openBiddingTime = parseTime(marketDetails.openBiddingTime);
    const openResultTime = parseTime(marketDetails.openResultTime);
    const closeBiddingTime = parseTime(marketDetails.closeBiddingTime);
    const closeResultTime = parseTime(marketDetails.closeResultTime);
    
    const bettingClosedTypes = ['Jodi', 'Open Sangam', 'Full Sangam', 'Open'];
    const closeOnlyTypes = ['Close', 'Close Sangam'];

    const updateButtonState = () => {
        const now = new Date();
        let isDisabled = false;
        let text = `Place Bets (Total: ₹${totalBetAmount})`;

        if (bettingClosedTypes.includes(betTypeName)) {
            if (now >= openBiddingTime) {
                text = "Betting Closed";
                isDisabled = true;
            }
        } else if (closeOnlyTypes.includes(betTypeName)) {
             if (now < openResultTime || now >= closeBiddingTime) {
                text = "Betting Closed";
                isDisabled = true;
            }
        } else { // For Pannas (which can be open or close)
            if ((now >= openBiddingTime && now < openResultTime) || (now >= closeBiddingTime && now < closeResultTime)) {
                text = "Betting Closed";
                isDisabled = true;
            }
        }
        
        if (now > closeResultTime) {
             text = "Betting Closed";
             isDisabled = true;
        }

        setButtonState({ text, disabled: isDisabled, loading: false });
    };
    
    updateButtonState();
    const intervalId = setInterval(updateButtonState, 30000); 

    return () => clearInterval(intervalId);

  }, [marketDetails, betTypeName, totalBetAmount]);


  const userDocRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, "users", authUser.uid) : null), [firestore, authUser]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<any>(userDocRef);

  const depositBalance = userData?.depositBalance || 0;
  const winningBalance = userData?.winningBalance || 0;
  const isLoading = isUserLoading || isUserDataLoading;
  const totalBalance = depositBalance + winningBalance;

  const handleBetsChange = (newBet: Bet) => {
     setBets(prevBets => {
        const updatedBets = [...prevBets, newBet];
        const newTotalBetAmount = updatedBets.reduce((sum, bet) => sum + parseInt(bet.amount || "0"), 0);
        if (newTotalBetAmount > totalBalance) {
            toast({
                variant: "destructive",
                title: "Insufficient Balance",
                description: `Your total bet of ₹${newTotalBetAmount} exceeds your wallet balance.`,
            });
            return prevBets; 
        }
        return updatedBets;
     });
  };

  const handleRemoveBet = (index: number) => {
    const newBets = bets.filter((_, i) => i !== index);
    setBets(newBets);
  };

  const handleSubmit = async () => {
    setIsPlacingBet(true);

    if (bets.length === 0) {
      toast({ variant: "destructive", title: "No Bets Added" });
      setIsPlacingBet(false);
      return;
    }

    if (totalBetAmount > totalBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance" });
      setIsPlacingBet(false);
      return;
    }

    if (!firestore || !authUser) {
         toast({ variant: "destructive", title: "Database Error" });
        setIsPlacingBet(false);
        return;
    }
    
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let isOpenResultDeclared = false;
    try {
        const resultQuery = query(
            collection(firestore, "kalyan_results"),
            where("marketName", "==", marketName),
            where("date", "==", dateString),
            limit(1)
        );
        const resultSnapshot = await getDocs(resultQuery);
        const todaysResult = resultSnapshot.empty ? null : resultSnapshot.docs[0].data();
        isOpenResultDeclared = !!todaysResult?.openPanna && todaysResult.openPanna !== 'H';
    } catch(error) {
        console.error("Could not fetch today's result for session determination:", error);
        toast({ variant: "destructive", title: "Session Error", description: "Could not determine if open market has passed." });
        setIsPlacingBet(false);
        return;
    }

    try {
        const batch = writeBatch(firestore);
        const userRef = doc(firestore, "users", authUser.uid);
        
        let amountToDeduct = totalBetAmount;
        let depositDeduction = Math.min(amountToDeduct, depositBalance);
        amountToDeduct -= depositDeduction;
        let winningDeduction = Math.min(amountToDeduct, winningBalance);

        batch.update(userRef, {
            depositBalance: increment(-depositDeduction),
            winningBalance: increment(-winningDeduction)
        });

        const transactionRef = doc(collection(firestore, "transactions"));
        batch.set(transactionRef, {
            userId: authUser.uid,
            userName: authUser.displayName || 'Unknown User',
            type: 'Bet',
            amount: -totalBetAmount,
            status: 'Placed',
            date: new Date().toISOString(),
            description: `Bets on ${betTypeName} (${bets.length} numbers) in ${marketName}`,
            market: marketName,
            gameType: betTypeName,
            betCount: bets.length
        });
        
        let session: 'Open' | 'Close' | 'Jodi';

        if (betTypeName === 'Jodi' || betTypeName === 'Full Sangam' || betTypeName === 'Open Sangam') {
            session = 'Jodi';
        } else if (betTypeName === 'Open') {
            session = 'Open';
        } else if (betTypeName === 'Close' || betTypeName === 'Close Sangam') {
            session = 'Close';
        } else { // Handles Panna types
            session = isOpenResultDeclared ? 'Close' : 'Open';
        }

        const gameTypeForDb = (betTypeName === 'Open' || betTypeName === 'Close') ? 'Single Digit' : betTypeName;

        bets.forEach(bet => {
            const betRef = doc(collection(firestore, "kalyan_bets"));
            batch.set(betRef, {
                userId: authUser.uid,
                userName: authUser.displayName || 'Unknown User',
                market: marketName,
                gameType: gameTypeForDb,
                number: bet.number,
                amount: parseInt(bet.amount, 10),
                status: 'Placed',
                session: session,
                transactionId: transactionRef.id,
                createdAt: serverTimestamp(),
            });
        });
        
        await batch.commit();

        toast({
          title: "Bets Placed!",
          description: `Your bets for ${betTypeName} (${marketName}) totaling ₹${totalBetAmount} have been placed.`
        });
        setBets([]);
    } catch(error: any) {
        console.error("Bet placement failed:", error);
        toast({ variant: "destructive", title: "Bet Failed", description: error.message || "Could not place your bets." });
    } finally {
        setIsPlacingBet(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="hidden lg:block lg:order-first lg:w-1/3">
            <WalletCard depositBalance={depositBalance} winningBalance={winningBalance} isLoading={isLoading} />
        </div>
        <div className="w-full lg:w-full">
            <BetForm betTypeName={betTypeName} market={marketName} onBetsChange={handleBetsChange} />
        </div>
      </div>

      <Card>
          <CardHeader>
              <div className="flex justify-between items-start">
                  <CardTitle>Your Bets</CardTitle>
                  {isLoading ? <Skeleton className="h-10 w-32" /> : (
                      <div className="text-right text-sm">
                          <p className="font-mono">Total: <span className="font-semibold">₹{totalBetAmount}</span></p>
                          <p className="font-mono text-muted-foreground">Remaining: <span className="font-semibold">₹{totalBalance - totalBetAmount}</span></p>
                      </div>
                  )}
              </div>
               <CardDescription>
                  A summary of the bets you are about to place.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {bets.length > 0 ? (
                  <div className="rounded-lg border">
                       <div className="w-full">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Number</TableHead>
                                      <TableHead>Amount</TableHead>
                                      <TableHead className="text-right">Action</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {bets.map((bet, index) => (
                                  <TableRow key={index}>
                                      <TableCell className="font-medium py-2">
                                          <Badge variant="secondary" className="font-mono">
                                              {bet.number}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="py-2">₹{bet.amount}</TableCell>
                                      <TableCell className="text-right py-2">
                                      <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                          onClick={() => handleRemoveBet(index)}
                                      >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Remove bet</span>
                                      </Button>
                                      </TableCell>
                                  </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </div>
              ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                      Add bets using the form to see them here.
                  </div>
              )}
          </CardContent>
           <CardFooter>
              <Button
                  type="button"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={bets.length === 0 || isPlacingBet || isLoading || buttonState.disabled}
                  variant={buttonState.disabled && buttonState.text === "Betting Closed" ? "destructive" : "default"}
              >
                  {isPlacingBet ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : buttonState.text !== `Place Bets (Total: ₹${totalBetAmount})` ? (
                    <Ban className="mr-2 h-4 w-4" />
                  ) : null}
                  {isPlacingBet ? "Placing Bets..." : buttonState.loading ? 'Loading...' : buttonState.text}
              </Button>
          </CardFooter>
      </Card>
    </div>
  );
}
