"use client";
import { useState } from "react";
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
import { PlusCircle, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const initialUsers = [
  { id: "USR001", name: "Ravi Kumar", mobile: "9876543210", balance: 1250.50, status: "Active" },
  { id: "USR002", name: "Sunita Sharma", mobile: "9876543211", balance: 500.00, status: "Active" },
  { id: "USR003", name: "Amit Patel", mobile: "9876543212", balance: 0.00, status: "Suspended" },
  { id: "USR004", name: "Priya Singh", mobile: "9876543213", balance: 2500.00, status: "Active" },
];

type User = typeof initialUsers[0];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newUser: User = {
      id: `USR${String(users.length + 1).padStart(3, '0')}`,
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      balance: parseFloat(formData.get("balance") as string || '0'),
      status: "Active",
    };

    if (!newUser.name || !newUser.mobile) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill in all required fields.",
        });
        return;
    }

    setUsers([newUser, ...users]);
    setIsDialogOpen(false);
    toast({
        title: "User Added",
        description: `${newUser.name} has been successfully added.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View, search, and manage all registered users.</CardDescription>
            <div className="flex items-center gap-2 pt-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users by name or mobile..." className="pl-8 max-w-sm" />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Enter the details below to create a new user account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddUser}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input id="name" name="name" className="col-span-3" placeholder="e.g., Anjali Verma" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="mobile" className="text-right">
                                        Mobile
                                    </Label>
                                    <Input id="mobile" name="mobile" className="col-span-3" placeholder="e.g., 9988776655" />
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="balance" className="text-right">
                                        Balance
                                    </Label>
                                    <Input id="balance" name="balance" type="number" defaultValue="0" className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create User</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
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
                  <TableCell className="py-2 px-4">{user.id}</TableCell>
                  <TableCell className="py-2 px-4">{user.name}</TableCell>
                  <TableCell className="py-2 px-4">{user.mobile}</TableCell>
                  <TableCell className="py-2 px-4">₹{user.balance.toFixed(2)}</TableCell>
                  <TableCell className="py-2 px-4">
                    <Badge variant={user.status === "Active" ? "secondary" : "destructive"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-4">
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
