
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type CommissionTransaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
};

export default function EnrollerEarningsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const commissionQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(
      collection(firestore, "transactions"),
      where("userId", "==", authUser.uid),
      where("type", "==", "Commission"),
      orderBy("date", "desc")
    );
  }, [firestore, authUser]);

  const { data: earnings, isLoading: areEarningsLoading } = useCollection<CommissionTransaction>(commissionQuery);

  const filteredEarnings = useMemo(() => {
    if (!earnings) return [];
    if (!searchTerm) return earnings;

    return earnings.filter((earning) =>
      earning.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [earnings, searchTerm]);
  
  const isLoading = isUserLoading || areEarningsLoading;

  const extractUserDetails = (description: string) => {
    const match = description.match(/for enrolling user (.*) \((.*)\)/);
    if (match) {
        return { name: match[1], customId: match[2] };
    }
    return { name: "Unknown User", customId: "" };
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <span>My Earnings</span>
          </CardTitle>
          <CardDescription>
            Commission earned from each of your enrolled users.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex justify-start items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Commission Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({length: 5}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : filteredEarnings && filteredEarnings.length > 0 ? (
                    filteredEarnings.map((earning) => {
                    const userDetails = extractUserDetails(earning.description);
                    return (
                        <TableRow key={earning.id}>
                            <TableCell>
                            <div className="font-medium">{userDetails.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {userDetails.customId}
                            </div>
                            </TableCell>
                            <TableCell>{new Date(earning.date).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">₹{earning.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    );
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No earnings found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-4 md:hidden">
            {isLoading ? (
                 Array.from({length: 3}).map((_, i) => (
                    <Card key={i} className="p-4 space-y-4">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                    </Card>
                 ))
            ) : filteredEarnings && filteredEarnings.length > 0 ? (
                filteredEarnings.map((earning) => {
                    const userDetails = extractUserDetails(earning.description);
                    return (
                    <Card key={earning.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{userDetails.name}</p>
                                <p className="text-xs text-muted-foreground">{userDetails.customId}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(earning.date).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Commission Earned:</span>
                                <span className="text-green-600 font-semibold">₹{earning.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </Card>
                    );
                })
            ) : (
                 <p className="text-center text-muted-foreground py-8">No earnings found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
