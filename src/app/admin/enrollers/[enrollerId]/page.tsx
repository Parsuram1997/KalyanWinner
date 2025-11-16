
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
import { User, Wallet, Phone, MapPin, Map, Mail } from "lucide-react";
import { useParams } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function EnrollerDetailsPage() {
  const params = useParams();
  const enrollerId = params.enrollerId as string;
  const firestore = useFirestore();

  const enrollerRef = useMemoFirebase(() => (firestore && enrollerId ? doc(firestore, "users", enrollerId) : null), [firestore, enrollerId]);
  const { data: enroller, isLoading: isEnrollerLoading } = useDoc<any>(enrollerRef);
  
  const enrolledUsersQuery = useMemoFirebase(() => {
    if (!firestore || !enroller) return null;
    return query(collection(firestore, "users"), where("enrollerId", "==", enroller.id));
  }, [firestore, enroller]);
  
  const { data: enrolledUsers, isLoading: areUsersLoading } = useCollection<any>(enrolledUsersQuery);

  const isLoading = isEnrollerLoading || areUsersLoading;

  if (isEnrollerLoading) {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!enroller) {
    return <div>Enroller not found</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            <span>{enroller.name}</span>
          </CardTitle>
          <CardDescription>Enroller ID: {enroller.customId}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">{enroller.mobile}</p>
            </div>
          </div>
           <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{enroller.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">State</p>
              <p className="font-medium">{enroller.state}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Map className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">District</p>
              <p className="font-medium">{enroller.district}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-5 h-5"></div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={enroller.status === "Active" ? "secondary" : "destructive"}>
                {enroller.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Users</CardTitle>
          <CardDescription>List of users enrolled by {enroller.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">Loading users...</TableCell>
                    </TableRow>
                ) : enrolledUsers && enrolledUsers.length > 0 ? (
                    enrolledUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>{user.customId}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                        <Badge variant={user.status === "Active" ? "secondary" : "destructive"}>
                            {user.status}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">₹{(user.balance || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={4} className="text-center">No users enrolled by this enroller yet.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
