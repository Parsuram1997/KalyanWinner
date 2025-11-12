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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const users = [
  { id: "USR001", name: "Ravi Kumar", mobile: "9876543210", balance: 1250.50, status: "Active" },
  { id: "USR002", name: "Sunita Sharma", mobile: "9876543211", balance: 500.00, status: "Active" },
  { id: "USR003", name: "Amit Patel", mobile: "9876543212", balance: 0.00, status: "Suspended" },
  { id: "USR004", name: "Priya Singh", mobile: "9876543213", balance: 2500.00, status: "Active" },
];

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View and manage all registered users.</CardDescription>
            <div className="flex items-center gap-2 pt-4">
                <Input placeholder="Search users by name or mobile..." className="max-w-sm" />
                <Button><Search className="mr-2 h-4 w-4"/>Search</Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.mobile}</TableCell>
                  <TableCell>₹{user.balance.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "Active" ? "secondary" : "destructive"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
