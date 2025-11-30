
"use client";
import { useState, useMemo, useEffect } from "react";
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
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Eye, Trash, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { createUser, deleteUser, updateUser } from "@/app/actions/user-actions";
import { states, districts } from "@/lib/locations";


const USERS_PER_PAGE = 10;

export default function ManageUsersPage() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const usersQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, "users"), where("role", "==", "User")) : null),
    [firestore, authUser]
  );
  const { data: users, isLoading: isUsersLoading } = useCollection<any>(usersQuery, { skip: !firestore });
  
  const isLoading = isUserLoading || isUsersLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // State for the edit form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editState, setEditState] = useState<string | null>(null);
  const [editDistrict, setEditDistrict] = useState<string | null>(null);


  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name);
      setEditEmail(selectedUser.email);
      const stateValue = states.find(s => s.label === selectedUser.state)?.value || null;
      setEditState(stateValue);
      if (stateValue) {
        const districtValue = districts[stateValue]?.find(d => d.label === selectedUser.district)?.value || null;
        setEditDistrict(districtValue);
      } else {
        setEditDistrict(null);
      }
    }
  }, [selectedUser]);


  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      createdBy: 'Admin' as 'Admin',
    };

    try {
      await createUser(newUser);
      setDialogOpen(false);
      toast({
        title: "User Added",
        description: `${newUser.name} has been added to the user list.`,
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
  
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    const form = e.currentTarget;
    const formData = new FormData(form);

    const updatedData = {
      name: editName,
      email: editEmail,
      state: states.find(s => s.value === (formData.get("edit-state") as string))?.label || '',
      district: districts[formData.get("edit-state") as string]?.find(d => d.value === (formData.get("edit-district") as string))?.label || '',
    };

    try {
      await updateUser(selectedUser.id, updatedData);
      setEditDialogOpen(false);
      toast({
        title: "User Updated",
        description: `${updatedData.name}'s details have been updated.`,
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Update User",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };


  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast({
        title: "User Deleted",
        description: `User has been successfully deleted.`,
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Delete User",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };


  const filteredUsers = useMemo(() => {
    let filtered = users || [];

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
  }, [users, searchTerm, filter]);
  
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  }


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="w-full">
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>
                    Manage all registered users in the application.
                </CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto shrink-0">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Fill in the details to add a new user.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input id="name" name="name" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="mobile" className="text-right">
                        Mobile
                      </Label>
                      <Input id="mobile" name="mobile" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
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
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
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
                <TabsList className="w-full">
                    <TabsTrigger value="All" className="px-2">All</TabsTrigger>
                    <TabsTrigger value="Active" className="px-2">Active</TabsTrigger>
                    <TabsTrigger value="Inactive" className="px-2">Inactive</TabsTrigger>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
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
                      <Badge
                        variant={
                          user.status === "Active"
                            ? "secondary"
                            : user.status === "Inactive"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2 py-1">
                       <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/users/${user.customId}`}><Eye className="h-4 w-4" /></Link>
                       </Button>
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(user)}><Edit className="h-4 w-4" /></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user '{user.name}' and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
              <Card key={user.id}>
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.customId}</p>
                        </div>
                        <Badge variant={user.status === "Active" ? "secondary" : user.status === "Inactive" ? "outline" : "destructive"}>
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
                    </div>
                  </div>
                  <CardFooter className="flex justify-end gap-2 p-4 pt-2 border-t">
                      <Button variant="outline" size="icon" asChild>
                          <Link href={`/admin/users/${user.customId}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(user)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user '{user.name}' and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardFooter>
                </CardContent>
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
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the details for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input id="edit-email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-state" className="text-right">State</Label>
              <Select name="edit-state" value={editState || ""} onValueChange={setEditState} required>
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
                <Label htmlFor="edit-district" className="text-right">District</Label>
                <Select name="edit-district" value={editDistrict || ""} onValueChange={setEditDistrict} disabled={!editState} required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a district" />
                    </SelectTrigger>
                    <SelectContent>
                        {editState && districts[editState] && districts[editState].map(district => (
                            <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    