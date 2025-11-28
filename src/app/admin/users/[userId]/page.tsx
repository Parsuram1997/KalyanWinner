
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Wallet, Phone, MapPin, Map } from "lucide-react";
import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

const BETS_PER_PAGE = 25;

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.userId as string; // This is the customId like 'KWUSR0001'
  const firestore = useFirestore();
  const [currentPage, setCurrentPage] = useState(1);
  
  // We need to find the user's document ID (the auth uid) from their customId
  const userQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'users'), where('customId', '==', userId));
  }, [firestore, userId]);
  
  const { data: users, isLoading: isUserQueryLoading } = useCollection<any>(userQuery);

  const userDocId = users?.[0]?.id; // This is the actual document ID (uid)

  const userRef = useMemoFirebase(() => {
    if (!firestore || !userDocId) return null;
    return doc(firestore, "users", userDocId);
  }, [firestore, userDocId]);

  const { data: user, isLoading: isUserLoading } = useDoc<any>(userRef);

  const betsQuery = useMemoFirebase(() => {
      if (!firestore || !userDocId) return null;
      return query(collection(firestore, "kalyan_bets"), where("userId", "==", userDocId));
  }, [firestore, userDocId]);
  
  const { data: userBets, isLoading: areBetsLoading } = useCollection<any>(betsQuery);

  const sortedBets = useMemo(() => {
    if (!userBets) return [];
    return [...userBets].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  }, [userBets]);

  const { paginatedBets, totalPages } = useMemo(() => {
    if (!sortedBets) return { paginatedBets: [], totalPages: 0 };
    const totalPages = Math.ceil(sortedBets.length / BETS_PER_PAGE);
    const startIndex = (currentPage - 1) * BETS_PER_PAGE;
    const endIndex = startIndex + BETS_PER_PAGE;
    const paginatedBets = sortedBets.slice(startIndex, endIndex);
    return { paginatedBets, totalPages };
  }, [sortedBets, currentPage]);


  const isLoading = isUserQueryLoading || isUserLoading || areBetsLoading;

  if (isLoading) {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }
  
  const totalBalance = (user.depositBalance || 0) + (user.winningBalance || 0);

  return (
    <div className="flex flex-col gap-6">
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            <span>{user.name}</span>
          </CardTitle>
          <CardDescription>User ID: {user.customId}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">{user.mobile}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">State</p>
              <p className="font-medium">{user.state}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Map className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">District</p>
              <p className="font-medium">{user.district}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="font-medium">₹{totalBalance.toFixed(2)}</p>
            </div>
          </div>
           <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Deposit Balance</p>
              <p className="font-medium">₹{(user.depositBalance || 0).toFixed(2)}</p>
            </div>
          </div>
           <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Winning Balance</p>
              <p className="font-medium">₹{(user.winningBalance || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-5 h-5"></div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={user.status === "Active" ? "secondary" : "destructive"}>
                {user.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bet History</CardTitle>
          <CardDescription>All bets placed by this user.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBets && paginatedBets.length > 0 ? paginatedBets.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell>{new Date(bet.createdAt.toDate()).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>{`${bet.gameType} (${bet.number})`}</TableCell>
                    <TableCell>{bet.market}</TableCell>
                    <TableCell>
                      <Badge variant={
                          bet.status === "Won" ? "default" :
                          bet.status === "Lost" ? "destructive" :
                          "outline"
                        }>
                        {bet.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">-₹{bet.amount.toFixed(2)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center">No bets placed by this user yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden">
            {areBetsLoading && <p className="text-center text-muted-foreground">Loading bet history...</p>}
            {!areBetsLoading && paginatedBets && paginatedBets.length > 0 ? paginatedBets.map((bet) => (
              <Card key={bet.id} className="p-4 text-xs">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{`${bet.gameType} (${bet.number})`}</p>
                    <p className="text-muted-foreground">{new Date(bet.createdAt.toDate()).toLocaleString('en-GB')}</p>
                  </div>
                   <Badge variant={ bet.status === "Won" ? "default" : bet.status === "Lost" ? "destructive" : "outline" }>
                      {bet.status}
                    </Badge>
                </div>
                <div className="space-y-1 border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market:</span>
                    <span className="font-medium">{bet.market}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">-₹{bet.amount.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            )) : (
              <p className="text-center text-muted-foreground py-8">No bets placed by this user yet.</p>
            )}
          </div>
        </CardContent>
         {totalPages > 1 && (
             <CardFooter className="flex justify-end items-center gap-4 border-t pt-4">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </CardFooter>
          )}
      </Card>
    </div>
  );
}
