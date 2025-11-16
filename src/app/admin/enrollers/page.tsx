
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { createUser } from "@/app/actions/user-actions";


const ENROLLERS_PER_PAGE = 10;

export default function ManageEnrollersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const enrollersQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, "users"), where("role", "==", "Enroller")) : null),
    [firestore, authUser]
  );
  const { data: enrollers, isLoading: isEnrollersLoading } = useCollection<any>(enrollersQuery);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const isLoading = isUserLoading || isEnrollersLoading;

  const handleAddEnroller = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const newEnroller = {
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      email: formData.get("email") as string,
      state: 'N/A', // Not required for enroller
      district: 'N/A', // Not required for enroller
      password: formData.get("password") as string,
      role: 'Enroller' as 'Enroller',
      commissionRate: parseFloat(formData.get("commissionRate") as string)
    };

    try {
      await createUser(newEnroller);
      setDialogOpen(false);
      toast({
        title: "Enroller Added",
        description: `${newEnroller.name} has been added to the enroller list.`,
      });
      form.reset();
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Add Enroller",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const filteredEnrollers = useMemo(() => {
    let filtered = enrollers || [];

    if (filter !== "All") {
      filtered = filtered.filter(enroller => enroller.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (enroller) =>
          enroller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enroller.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [enrollers, searchTerm, filter]);
  
  const totalPages = Math.ceil(filteredEnrollers.length / ENROLLERS_PER_PAGE);

  const paginatedEnrollers = useMemo(() => {
    const startIndex = (currentPage - 1) * ENROLLERS_PER_PAGE;
    const endIndex = startIndex + ENROLLERS_PER_PAGE;
    return filteredEnrollers.slice(startIndex, endIndex);
  }, [filteredEnrollers, currentPage]);


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle>Manage Enrollers</CardTitle>
                <CardDescription>
                    Add, edit, or suspend enrollers in the application.
                </CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="shrink-0">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Enroller
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Enroller</DialogTitle>
                    <DialogDescription>
                      Fill in the details to add a new enroller.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddEnroller} className="grid gap-4 py-4">
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
                      <Input id="mobile" name="mobile" type="tel" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input id="email" name="email" type="email" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="commissionRate" className="text-right">
                        Commission Rate (%)
                      </Label>
                      <Input id="commissionRate" name="commissionRate" type="number" className="col-span-3" defaultValue="5" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input id="password" name="password" type="text" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Enroller</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-start items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
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
                  <TableHead>Enroller</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading enrollers...</TableCell>
                  </TableRow>
                )}
                {!isLoading && paginatedEnrollers.map((enroller) => (
                  <TableRow key={enroller.id}>
                    <TableCell>
                      <div className="font-medium">{enroller.name}</div>
                      <div className="text-xs text-muted-foreground">{enroller.id}</div>
                    </TableCell>
                    <TableCell>
                      <div>{enroller.email}</div>
                    </TableCell>
                    <TableCell>{enroller.commissionRate}%</TableCell>
                    <TableCell>₹{(enroller.totalEarnings || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          enroller.status === "Active"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {enroller.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                       <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
           <div className="grid gap-4 md:hidden">
            {isLoading && <p className="text-center text-muted-foreground">Loading enrollers...</p>}
            {!isLoading && paginatedEnrollers.map((enroller) => (
              <Card key={enroller.id} className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{enroller.name}</p>
                        <p className="text-xs text-muted-foreground">{enroller.id}</p>
                    </div>
                    <Badge variant={enroller.status === "Active" ? "secondary" : "destructive"}>
                        {enroller.status}
                    </Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <div className="text-right">
                            <p>{enroller.email}</p>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission:</span>
                        <span>{enroller.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Earnings:</span>
                        <span>₹{(enroller.totalEarnings || 0).toFixed(2)}</span>
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                    <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
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
