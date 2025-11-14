"use client";

import {
  Card,
  CardContent,
  CardDescription,
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

// Mock data - in a real app, you would fetch this based on the userId
const initialUsers = [
  { id: "USR001", name: "Ravi Kumar", mobile: "9876543210", balance: 1250.50, status: "Active", state: "Maharashtra", district: "Mumbai" },
  { id: "USR002", name: "Sunita Sharma", mobile: "9876543211", balance: 500.00, status: "Active", state: "Delhi", district: "New Delhi" },
  { id: "USR003", name: "Amit Patel", mobile: "9876543212", balance: 0.00, status: "Suspended", state: "Gujarat", district: "Ahmedabad" },
  { id: "USR004", name: "Priya Singh", mobile: "9876543213", balance: 2500.00, status: "Active", state: "Uttar Pradesh", district: "Lucknow" },
];

const recentActivity = [
  { id: 1, userId: "USR001", description: "Bet on Jodi 45", market: "Kalyan Night", status: "Pending", date: "2024-07-20", amount: "-₹100.00", type: "debit" },
  { id: 2, userId: "USR001", description: "Wallet Deposit", market: "via UPI", status: "Completed", date: "2024-07-19", amount: "+₹500.00", type: "credit" },
  { id: 3, userId: "USR001", description: "Win on Single 8", market: "Kalyan Day", status: "Won", date: "2024-07-18", amount: "+₹950.00", type: "credit" },
  { id: 4, userId: "USR002", description: "Bet on Open Panna 123", market: "Kalyan Day", status: "Lost", date: "2024-07-18", amount: "-₹50.00", type: "debit" },
  { id: 5, userId: "USR003", description: "Withdrawal", market: "to Bank Account", status: "Completed", date: "2024-07-17", amount: "-₹1000.00", type: "debit" },
  { id: 6, userId: "USR004", description: "Bet on Jodi 78", market: "Kalyan Night", status: "Pending", date: "2024-07-17", amount: "-₹200.00", type: "debit" },
];

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const user = initialUsers.find((u) => u.id === userId);
  const userBets = recentActivity.filter(activity => activity.userId === userId && activity.description.toLowerCase().includes('bet'));

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            <span>{user.name}</span>
          </CardTitle>
          <CardDescription>User ID: {user.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="font-medium">₹{user.balance.toFixed(2)}</p>
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
              {userBets.length > 0 ? userBets.map((bet) => (
                <TableRow key={bet.id}>
                  <TableCell>{bet.date}</TableCell>
                  <TableCell>{bet.description}</TableCell>
                  <TableCell>{bet.market}</TableCell>
                  <TableCell>
                    <Badge variant={
                        bet.status === "Won" ? "default" :
                        bet.status === "Completed" ? "secondary" :
                        bet.status === "Lost" ? "destructive" :
                        "outline"
                      }>
                      {bet.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{bet.amount}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No bets placed by this user yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
