
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
import { PlusCircle, Search, Edit, Trash } from "lucide-react";
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { createUser, deleteUser, updateUser } from "@/app/actions/user-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { states, districts } from "@/lib/locations";
import { cn } from "@/lib/utils";

const ADMINS_PER_PAGE = 10;

export default function ManageAdminsPage() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const adminsQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, "users"), where("role", "==", "Admin")) : null),
    [firestore, authUser]
  );
  const { data: admins, isLoading: isAdminsLoading } = useCollection<any>(adminsQuery, { skip: !firestore });

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const isLoading = isUserLoading || isAdminsLoading;
  
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    if (selectedAdmin) {
      setEditName(selectedAdmin.name);
      setEditEmail(selectedAdmin.email);
    }
  }, [selectedAdmin]);

  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const newAdmin = {
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      email: formData.get("email") as string,
      state: states.find(s => s.value === (formData.get("state") as string))?.label || '',
      district: districts[formData.get("state") as string]?.find(d => d.value === (formData.get("district") as string))?.label || '',
      password: formData.get("password") as string,
      role: 'Admin' as 'Admin'
    };

    try {
      await createUser(newAdmin);
      setAddDialogOpen(false);
      toast({ title: "Admin Added", description: `${newAdmin.name} has been added.` });
      form.reset();
      setSelectedState(null);
    } catch (error: any) {
       toast({ variant: "destructive", title: "Failed to Add Admin", description: error.message });
    }
  };
  
  const handleEditAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    try {
      await updateUser(selectedAdmin.id, { name: editName, email: editEmail });
      setEditDialogOpen(false);
      toast({ title: "Admin Updated", description: `${editName}'s details have been updated.` });
    } catch (error: any) {
       toast({ variant: "destructive", title: "Failed to Update Admin", description: error.message });
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await deleteUser(adminId);
      toast({ title: "Admin Deleted", description: "The admin has been deleted." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to Delete Admin", description: error.message });
    }
  };

  const filteredAdmins = useMemo(() => {
    let filtered = admins || [];
    if (searchTerm) {
      filtered = filtered.filter(admin =>
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [admins, searchTerm]);
  
  const totalPages = Math.ceil(filteredAdmins.length / ADMINS_PER_PAGE);

  const paginatedAdmins = useMemo(() => {
    const startIndex = (currentPage - 1) * ADMINS_PER_PAGE;
    return filteredAdmins.slice(startIndex, startIndex + ADMINS_PER_PAGE);
  }, [filteredAdmins, currentPage]);

  const openEditDialog = (admin: any) => {
    setSelectedAdmin(admin);
    setEditDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
                <CardTitle>Manage Admins</CardTitle>
                <CardDescription className="text-white/80">
                    Add, edit, or remove admins in the application.
                </CardDescription>
            </div>
             <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto shrink-0 bg-white text-primary hover:bg-white/90">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Admin</DialogTitle>
                    <DialogDescription>
                      Fill in the details to add a new admin.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAdmin} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" name="name" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="mobile" className="text-right">Mobile</Label>
                      <Input id="mobile" name="mobile" type="tel" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">Email</Label>
                      <Input id="email" name="email" type="email" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="state" className="text-right">State</Label>
                        <Select name="state" onValueChange={setSelectedState} required>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a state" /></SelectTrigger>
                            <SelectContent>
                                {states.map(state => <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="district" className="text-right">District</Label>
                        <Select name="district" disabled={!selectedState} required>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a district" /></SelectTrigger>
                            <SelectContent>
                                {selectedState && districts[selectedState] && districts[selectedState].map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">Password</Label>
                      <Input id="password" name="password" type="text" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Admin</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-start items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8 bg-black/20 border-white/20 text-white"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
          
          <div className="hidden md:block rounded-md border border-white/20">
            <Table>
              <TableHeader className="border-b border-white/20">
                <TableRow>
                  {["Admin", "Contact", "Location", "Status", "Actions"].map(h => <TableHead key={h} className="text-white">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading admins...</TableCell></TableRow>
                ) : paginatedAdmins.map((admin) => (
                  <TableRow key={admin.id} className="border-white/20">
                    <TableCell>
                      <div className="font-medium">{admin.name}</div>
                      <div className="text-xs text-white/70">{admin.customId}</div>
                    </TableCell>
                    <TableCell>
                      <div>{admin.email}</div>
                      <div className="text-sm text-white/70">{admin.mobile}</div>
                    </TableCell>
                    <TableCell>
                      <div>{admin.state}</div>
                      <div className="text-sm text-white/70">{admin.district}</div>
                    </TableCell>
                    <TableCell>
                       <Badge className={cn(
                            "text-xs",
                            admin.status === 'Active' ? "bg-green-400/20 text-green-300 border border-green-400" :
                            "bg-red-400/20 text-red-300 border border-red-400"
                        )}>
                        {admin.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(admin)} className="bg-transparent text-white hover:bg-white/10"><Edit className="h-4 w-4" /></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" disabled={admin.id === authUser?.uid}><Trash className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the admin '{admin.name}'.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteAdmin(admin.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

           <div className="grid gap-4 md:hidden">
            {isLoading && <p className="text-center text-white/80 py-8">Loading admins...</p>}
            {!isLoading && paginatedAdmins.map((admin) => (
              <Card key={admin.id} className="p-4 bg-black/20 border-white/20">
                <div className="flex justify-between items-start">
                    <div><p className="font-semibold">{admin.name}</p><p className="text-xs text-white/70">{admin.customId}</p></div>
                    <Badge className={cn("text-xs", admin.status === "Active" ? "bg-green-400/20 text-green-300 border border-green-400" : "bg-red-400/20 text-red-300 border border-red-400")}>{admin.status}</Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm border-t border-white/20 pt-3">
                    <div className="flex justify-between"><span className="text-white/70">Contact:</span><div className="text-right"><p>{admin.email}</p><p>{admin.mobile}</p></div></div>
                    <div className="flex justify-between"><span className="text-white/70">Location:</span><div className="text-right"><p>{admin.state}</p><p className="text-xs">{admin.district}</p></div></div>
                </div>
                <div className="mt-4 flex justify-end gap-2 border-t border-white/20 pt-3">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(admin)} className="bg-transparent hover:bg-white/10"><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" size="icon" disabled={admin.id === authUser?.uid}><Trash className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete '{admin.name}'.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteAdmin(admin.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </Card>
            ))}
           </div>
        </CardContent>
        <CardFooter className="border-t border-white/20 pt-4">
           <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="bg-transparent hover:bg-white/10">Previous</Button>
            <span className="text-sm text-white/80">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="bg-transparent hover:bg-white/10">Next</Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Update the details for {selectedAdmin?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAdmin} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">Email</Label>
              <Input id="edit-email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" className="col-span-3" required />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
