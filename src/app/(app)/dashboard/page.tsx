import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, PlusCircle } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const quickBets = [
  "123-45-678",
  "432-98-123",
  "567-89-101",
  "111-33-555",
  "246-22-789",
  "357-55-135",
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,245.50</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm" asChild>
              <Link href="/wallet">
                <PlusCircle className="mr-1.5 h-4 w-4" /> Add Funds
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Latest Result</CardTitle>
            <CardDescription>Kalyan Morning - 20/07/2024</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-2">
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">Open</span>
              <span className="text-2xl font-bold tracking-widest">128</span>
            </div>
            <div className="flex flex-col items-center rounded-md bg-primary px-3 py-1 text-primary-foreground">
              <span className="text-3xl font-bold tracking-wider">13</span>
              <span className="text-[10px] font-medium">Jodi</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">Close</span>
              <span className="text-2xl font-bold tracking-widest">490</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/results">View All Results</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Quick Bet</CardTitle>
            <CardDescription>Place a bet on popular numbers.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {quickBets.map((bet) => (
              <Button variant="secondary" size="sm" key={bet} asChild>
                <Link href="/play">{bet}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Bet on Jodi 45</div>
                    <div className="text-sm text-muted-foreground">
                      Kalyan Night
                    </div>
                  </TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell>2024-07-20</TableCell>
                  <TableCell className="text-right">-₹100.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Wallet Deposit</div>
                    <div className="text-sm text-muted-foreground">
                      via UPI
                    </div>
                  </TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>2024-07-19</TableCell>
                  <TableCell className="text-right text-green-600">+₹500.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Win on Single 8</div>
                    <div className="text-sm text-muted-foreground">
                      Kalyan Morning
                    </div>
                  </TableCell>
                  <TableCell>Won</TableCell>
                  <TableCell>2024-07-18</TableCell>
                  <TableCell className="text-right text-green-600">+₹950.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-4 md:hidden">
             <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Bet on Jodi 45</div>
                  <div className="text-sm text-muted-foreground">Kalyan Night - 2024-07-20</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">-₹100.00</div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
               <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Wallet Deposit</div>
                  <div className="text-sm text-muted-foreground">via UPI - 2024-07-19</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">+₹500.00</div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Win on Single 8</div>
                  <div className="text-sm text-muted-foreground">Kalyan Morning - 2024-07-18</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">+₹950.00</div>
                  <Badge>Won</Badge>
                </div>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}