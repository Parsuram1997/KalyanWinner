
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";

// Mock data, in a real app this would come from your database
const bidData = {
  "open-digit": [
    { number: "1", totalAmount: 500, totalBids: 15 },
    { number: "5", totalAmount: 1200, totalBids: 40 },
    { number: "8", totalAmount: 250, totalBids: 10 },
  ],
  "close-digit": [
     { number: "3", totalAmount: 800, totalBids: 25 },
     { number: "7", totalAmount: 650, totalBids: 20 },
  ],
  "jodi": [
      { number: "13", totalAmount: 100, totalBids: 5 },
      { number: "57", totalAmount: 300, totalBids: 12 },
      { number: "83", totalAmount: 50, totalBids: 2 },
  ],
  "single-panna": [
      { number: "128", totalAmount: 50, totalBids: 1 },
      { number: "345", totalAmount: 150, totalBids: 3 },
  ],
  "double-panna": [
       { number: "118", totalAmount: 200, totalBids: 4 },
  ],
  "triple-panna": [],
};

type Bid = {
  number: string;
  totalAmount: number;
  totalBids: number;
};

const BidDetailsTable = ({ bids }: { bids: Bid[] }) => {
    if (bids.length === 0) {
        return <p className="text-center text-muted-foreground p-8">No bids for this type yet.</p>
    }
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead className="text-right">Total Bids</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.sort((a,b) => b.totalAmount - a.totalAmount).map((bid) => (
            <TableRow key={bid.number}>
              <TableCell className="font-mono font-medium">{bid.number}</TableCell>
              <TableCell className="text-right">₹{bid.totalAmount.toFixed(2)}</TableCell>
              <TableCell className="text-right">{bid.totalBids}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};


export default function BiddingDetailsPage() {
    const params = useParams();
    const marketSlug = params.market as string;
    const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="flex flex-col gap-6">
       <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{marketName} - Bidding Details</h1>
        <p className="text-muted-foreground">
          A summary of all bids placed on this market.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
             <Tabs defaultValue="open-digit" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4">
                    <TabsTrigger value="open-digit">Open Digit</TabsTrigger>
                    <TabsTrigger value="close-digit">Close Digit</TabsTrigger>
                    <TabsTrigger value="jodi">Jodi</TabsTrigger>
                    <TabsTrigger value="single-panna">Single Panna</TabsTrigger>
                    <TabsTrigger value="double-panna">Double Panna</TabsTrigger>
                    <TabsTrigger value="triple-panna">Triple Panna</TabsTrigger>
                </TabsList>
                <TabsContent value="open-digit">
                    <BidDetailsTable bids={bidData["open-digit"]} />
                </TabsContent>
                <TabsContent value="close-digit">
                     <BidDetailsTable bids={bidData["close-digit"]} />
                </TabsContent>
                 <TabsContent value="jodi">
                     <BidDetailsTable bids={bidData["jodi"]} />
                </TabsContent>
                 <TabsContent value="single-panna">
                     <BidDetailsTable bids={bidData["single-panna"]} />
                </TabsContent>
                 <TabsContent value="double-panna">
                     <BidDetailsTable bids={bidData["double-panna"]} />
                </TabsContent>
                 <TabsContent value="triple-panna">
                     <BidDetailsTable bids={bidData["triple-panna"]} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

    </div>
  );
}
