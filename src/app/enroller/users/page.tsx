
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
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { createUser } from "@/app/actions/user-actions";
import { states, districts } from "@/lib/locations";


const USERS_PER_PAGE = 10;

export default function EnrolledUsersPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const enrollerRef = useMemoFirebase(() => authUser ? doc(firestore, "users", authUser.uid) : null, [firestore, authUser]);
  const { data: enroller, isLoading: isEnrollerLoading } = useDoc<any>(enrollerRef);
  const enrollerCustomId = enroller?.customId;


  const enrolledUsersQuery = useMemoFirebase(
    () => {
      if (!firestore || !authUser || !enrollerCustomId) return null;
      // Query by both customId and auth UID to fetch all users, old and new.
      return query(collection(firestore, "users"), where("enrollerId", "in", [enrollerCustomId, authUser.uid]));
    },
    [firestore, authUser, enrollerCustomId]
  );
  const { data: enrolledUsers, isLoading: areUsersLoading } = useCollection<any>(enrolledUsersQuery, { skip: !enrollerCustomId || !authUser });

  const isLoading = isUserLoading || isEnrollerLoading || areUsersLoading;

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authUser || !enrollerCustomId) {
      toast({ variant: "destructive", title: "Authentication Error", description: "Enroller details not found. Please re-login." });
      return;
    }
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const newUser = {
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      email: formData.get("email") as string,
      state: states.find(s => s.value === (formData.get("state") as string))?.label || '',
      district: districts[formData.get("state") as string]?.find(d => d.value === (formData.get("district") as string))?.label || '',
      password: formData.get("password") as string,
      role: 'User' as 'User',
      createdBy: 'Enroller' as 'Enroller',
      enrollerId: enrollerCustomId, // Pass the enroller's CUSTOM ID
    };

    try {
      await createUser(newUser);
      setDialogOpen(false);
      toast({
        title: "User Added",
        description: `${newUser.name} has been added to your enrolled users.`,
      });
      form.reset();
      setSelectedState(null);
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Add User",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = enrolledUsers || [];

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
  }, [enrolledUsers, searchTerm, filter]);
  
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4">
            <div>
                <CardTitle>Enrolled Users</CardTitle>
                <CardDescription>
                    Manage all users you have enrolled in the application.
                </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="shrink-0 w-full sm:w-auto">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Fill in the details to add a new user under your enrollment.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" name="name" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="mobile" className="text-right">Mobile</Label>
                      <Input id="mobile" name="mobile" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">Email</Label>
                      <Input id="email" name="email" type="email" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="state" className="text-right">State</Label>
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
                        <Label htmlFor="district" className="text-right">District</Label>
                        <Select name="district" disabled={!selectedState}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a district" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedState && districts[selectedState] && districts[selectedState].map(district => (
                                    <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">Password</Label>
                      <Input id="password" name="password" type="text" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create User</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-start items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
              />
            </div>
            <Tabs defaultValue="All" onValueChange={(value) => {
                setFilter(value);
                setCurrentPage(1);
            }} className="w-full sm:w-auto">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="All" className="px-2">All</TabsTrigger>
                    <TabsTrigger value="Active" className="px-2">Active</TabsTrigger>
                    <TabsTrigger value="Suspended" className="px-2">Suspended</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
          
           {/* Desktop Table */}
          <div className="hidden md:block rounded-md border text-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Referral Bonus</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-1">Loading users...</TableCell>
                  </TableRow>
                )}
                {!isLoading && paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="py-1">
                      <div className="font-medium text-xs">{user.name}</div>
                      <div className="text-muted-foreground text-xs">{user.customId}</div>
                    </TableCell>
                    <TableCell className="py-1">
                      <div className="text-xs">{user.email}</div>
                      <div className="text-muted-foreground text-xs">{user.mobile}</div>
                    </TableCell>
                    <TableCell className="py-1">
                      <div className="text-xs">{user.state}</div>
                      <div className="text-muted-foreground text-xs">{user.district}</div>
                    </TableCell>
                    <TableCell className="text-xs py-1">₹{((user.depositBalance || 0) + (user.winningBalance || 0)).toFixed(2)}</TableCell>
                    <TableCell className="py-1">
                      <Badge variant={user.commissionPaid ? "secondary" : "outline"}>
                        {user.commissionPaid ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
           <div className="grid gap-4 md:hidden">
            {isLoading && <p className="text-center text-muted-foreground">Loading users...</p>}
            {!isLoading && paginatedUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.customId}</p>
                    </div>
                    <Badge variant={user.status === "Active" ? "secondary" : "destructive"}>
                        {user.status}
                    </Badge>
                </div>
                <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <div className="text-right">
                            <p>{user.email}</p>
                            <p className="text-muted-foreground">{user.mobile}</p>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <div className="text-right">
                           <p>{user.state}</p>
                           <p className="text-xs text-muted-foreground">{user.district}</p>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Balance:</span>
                        <span>₹{((user.depositBalance || 0) + (user.winningBalance || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Referral Bonus:</span>
                        <Badge variant={user.commissionPaid ? "secondary" : "outline"}>
                           {user.commissionPaid ? "Paid" : "Pending"}
                        </Badge>
                    </div>
                </div>
              </Card>
            ))}
           </div>
        </CardContent>
        <CardFooter>
           <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

    