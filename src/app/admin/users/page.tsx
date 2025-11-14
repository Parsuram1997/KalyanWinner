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
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialUsers = [
  { id: "USR001", name: "Ravi Kumar", mobile: "9876543210", balance: 1250.50, status: "Active", state: "Maharashtra", district: "Mumbai" },
  { id: "USR002", name: "Sunita Sharma", mobile: "9876543211", balance: 500.00, status: "Active", state: "Delhi", district: "New Delhi" },
  { id: "USR003", name: "Amit Patel", mobile: "9876543212", balance: 0.00, status: "Suspended", state: "Gujarat", district: "Ahmedabad" },
  { id: "USR004", name: "Priya Singh", mobile: "9876543213", balance: 2500.00, status: "Active", state: "Uttar Pradesh", district: "Lucknow" },
];

const states = [
    { value: "maharashtra", label: "Maharashtra" },
    { value: "delhi", label: "Delhi" },
    { value: "gujarat", label: "Gujarat" },
    { value: "uttar-pradesh", label: "Uttar Pradesh" },
];

const districts: { [key: string]: { value: string, label: string }[] } = {
    maharashtra: [
        { value: "mumbai", label: "Mumbai" },
        { value: "pune", label: "Pune" },
        { value: "nagpur", label: "Nagpur" },
    ],
    delhi: [
        { value: "new-delhi", label: "New Delhi" },
        { value: "north-delhi", label: "North Delhi" },
    ],
    gujarat: [
        { value: "ahmedabad", label: "Ahmedabad" },
        { value: "surat", label: "Surat" },
    ],
    "uttar-pradesh": [
        { value: "lucknow", label: "Lucknow" },
        { value: "kanpur", label: "Kanpur" },
    ]
};


type User = typeof initialUsers[0];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('');
  const { toast } = useToast();

  const handleAddUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const stateValue = formData.get("state") as string;
    const newUser: User = {
      id: `USR${String(users.length + 1).padStart(3, '0')}`,
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      state: states.find(s => s.value === stateValue)?.label || '',
      district: formData.get("district") as string,
      balance: parseFloat(formData.get("balance") as string || '0'),
      status: "Active",
    };
    const password = formData.get("password") as string;


    if (!newUser.name || !newUser.mobile || !password || !newUser.state || !newUser.district) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill in all required fields.",
        });
        return;
    }

    setUsers([newUser, ...users]);
    setIsDialogOpen(false);
    setSelectedState('');
    toast({
        title: "User Added",
        description: `${newUser.name} has been successfully added.`,
    });
    // In a real app, you would also save the password securely.
    console.log(`New user created with password: ${password}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View, search, and manage all registered users.</CardDescription>
            <div className="flex items-center gap-2 pt-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users by name or mobile..." className="pl-8 max-w-sm" />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setSelectedState(''); }}>
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
                                    <Label htmlFor="state" className="text-right">
                                        State
                                    </Label>
                                    <Select name="state" onValueChange={setSelectedState}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a state" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {states.map(state => (
                                                <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="district" className="text-right">
                                        District
                                    </Label>
                                    <Select name="district" disabled={!selectedState}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a district" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedState && districts[selectedState]?.map(district => (
                                                <SelectItem key={district.value} value={district.label}>{district.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="balance" className="text-right">
                                        Balance
                                    </Label>
                                    <Input id="balance" name="balance" type="number" defaultValue="0" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="password" className="text-right">
                                        Password
                                    </Label>
                                    <Input id="password" name="password" type="password" className="col-span-3" placeholder="Set a password" />
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
                <TableHead>State</TableHead>
                <TableHead>District</TableHead>
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
                  <TableCell className="py-2 px-4">{user.state}</TableCell>
                  <TableCell className="py-2 px-4">{user.district}</TableCell>
                  <TableCell className="py-2 px-4">₹{user.balance.toFixed(2)}</TableCell>
                  <TableCell className="py-2 px-4">
                    <Badge variant={user.status === "Active" ? "secondary" : "destructive"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/users/${user.id}`}>View</Link>
                    </Button>
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
