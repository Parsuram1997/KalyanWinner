"use client";
import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


const enrolledUsers = [
  { id: "USR001", name: "Ravi Kumar", mobile: "9876543210", email: "ravi.k@example.com", balance: 1250.50, status: "Active", state: "Maharashtra", district: "Mumbai", totalDeposit: 5000 },
  { id: "USR002", name: "Sunita Sharma", mobile: "9876543211", email: "sunita.s@example.com", balance: 500.00, status: "Active", state: "Delhi", district: "New Delhi", totalDeposit: 2500 },
  { id: "USR003", name: "Amit Patel", mobile: "9876543212", email: "amit.p@example.com", balance: 0.00, status: "Suspended", state: "Gujarat", district: "Ahmedabad", totalDeposit: 1000 },
  { id: "USR004", name: "Priya Singh", mobile: "9876543213", email: "priya.s@example.com", balance: 2500.00, status: "Active", state: "Uttar Pradesh", district: "Lucknow", totalDeposit: 10000 },
  { id: "USR005", name: "Inactive User", mobile: "9876543214", email: "inactive.user@example.com", balance: 100.00, status: "Inactive", state: "Rajasthan", district: "Jaipur", totalDeposit: 500 },
];

export default function EnrolledUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredUsers = useMemo(() => {
    let filtered = enrolledUsers;

    if (filter !== "All") {
      filtered = filtered.filter(user => user.status === filter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.mobile.includes(searchTerm)
      );
    }

    return filtered;
  }, [searchTerm, filter]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
            <div>
                <CardTitle>Enrolled Users</CardTitle>
                <CardDescription>
                    List of all users you have enrolled.
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-start items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs defaultValue="All" onValueChange={setFilter} className="w-full sm:w-auto">
                <TabsList className="w-full">
                    <TabsTrigger value="All" className="px-2">All</TabsTrigger>
                    <TabsTrigger value="Active" className="px-2">Active</TabsTrigger>
                    <TabsTrigger value="Suspended" className="px-2">Suspended</TabsTrigger>
                    <TabsTrigger value="Inactive" className="px-2">Inactive</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
          
           {/* Desktop Table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Total Deposit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.id}</div>
                    </TableCell>
                    <TableCell>
                      <div>{user.mobile}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div>{user.district}</div>
                      <div className="text-xs text-muted-foreground">{user.state}</div>
                    </TableCell>
                    <TableCell>₹{user.totalDeposit.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "Active"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/users/${user.id}`}><Search className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
           <div className="grid gap-4 md:hidden">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.id}</p>
                    </div>
                    <Badge variant={user.status === "Active" ? "secondary" : "destructive"}>
                        {user.status}
                    </Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <div className="text-right">
                            <p>{user.mobile}</p>
                            <p className="text-xs">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <div className="text-right">
                           <p>{user.district}</p>
                           <p className="text-xs">{user.state}</p>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Deposit:</span>
                        <span>₹{user.totalDeposit.toFixed(2)}</span>
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/users/${user.id}`}><Search className="h-4 w-4" /></Link>
                      </Button>
                </div>
              </Card>
            ))}
           </div>

        </CardContent>
      </Card>
    </div>
  );
}
