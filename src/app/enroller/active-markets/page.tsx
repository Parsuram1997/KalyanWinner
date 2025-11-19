
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
import { Store } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

type Market = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  status: "Active" | "Inactive";
};

export default function ActiveMarketsPage() {
  const firestore = useFirestore();
  const marketsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "markets"), where("status", "==", "Active"))
        : null,
    [firestore]
  );
  const { data: markets, isLoading } = useCollection<Market>(marketsQuery, { skip: !firestore });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <span>Market List</span>
          </CardTitle>
          <CardDescription>
            Only markets with an "Active" status are shown here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">Market Name</TableHead>
                  <TableHead className="text-center text-base">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow>
                    <TableCell colSpan={2} className="text-center">Loading markets...</TableCell>
                  </TableRow>
                ) : markets?.map((market) => (
                  <TableRow key={market.id}>
                    <TableCell className="font-medium text-base">{market.name}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="secondary">{market.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                 {!isLoading && markets?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No active markets found.
                    </TableCell>
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

    