
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
import { TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Mock data, in a real app this would come from your database
const earningsData = [
  { id: "USR001", name: "Ravi Kumar", totalDeposit: 5000, commissionEarned: 250 },
  { id: "USR002", name: "Sunita Sharma", totalDeposit: 2500, commissionEarned: 125 },
  { id: "USR003", name: "Amit Patel", totalDeposit: 1000, commissionEarned: 50 },
  { id: "USR004", name: "Priya Singh", totalDeposit: 10000, commissionEarned: 500 },
  { id: "USR005", name: "Inactive User", totalDeposit: 500, commissionEarned: 25 },
  { id: "USR006", name: "Rohan Das", totalDeposit: 8000, commissionEarned: 400 },
  { id: "USR007", name: "Anita Desai", totalDeposit: 15000, commissionEarned: 750 },
  { id: "USR008", name: "Suresh Gupta", totalDeposit: 1000, commissionEarned: 50 },
];

export default function EnrollerEarningsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredEarnings = useMemo(() => {
    if (!searchTerm) return earningsData;

    return earningsData.filter(
      (earning) =>
        earning.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        earning.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <span>User Earnings</span>
          </CardTitle>
          <CardDescription>
            Commission earned from each of your enrolled users. (Note: This is demo data)
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
                  <TableHead>Total Deposit</TableHead>
                  <TableHead>Commission Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEarnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      <div className="font-medium">{earning.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {earning.id}
                      </div>
                    </TableCell>
                    <TableCell>₹{earning.totalDeposit.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-semibold">₹{earning.commissionEarned.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-4 md:hidden">
            {filteredEarnings.map((earning) => (
              <Card key={earning.id} className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{earning.name}</p>
                        <p className="text-xs text-muted-foreground">{earning.id}</p>
                    </div>
                </div>
                 <div className="mt-4 space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Deposit:</span>
                        <span>₹{earning.totalDeposit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission Earned:</span>
                        <span className="text-green-600 font-semibold">₹{earning.commissionEarned.toFixed(2)}</span>
                    </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
