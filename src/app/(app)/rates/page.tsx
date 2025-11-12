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
import { Coins } from "lucide-react";

const rates = [
  { game: "Single Digit", rate: "10 ka 100" },
  { game: "Jodi", rate: "10 ka 950" },
  { game: "Single Panna", rate: "10 ka 1400" },
  { game: "Double Panna", rate: "10 ka 2800" },
  { game: "Triple Panna", rate: "10 ka 7000" },
  { game: "Half Sangam", rate: "10 ka 10,000" },
  { game: "Full Sangam", rate: "10 ka 1,00,000" },
];

export default function RatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Game Rates</h1>
        <p className="text-muted-foreground">
          View the payout rates for different game types.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            <span>Kalyan Matka Payout Rates</span>
          </CardTitle>
          <CardDescription>
            The rates below show the payout for a winning bet of ₹10.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">Game Type</TableHead>
                  <TableHead className="text-right text-base">Payout Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((item) => (
                  <TableRow key={item.game}>
                    <TableCell className="font-medium text-base">{item.game}</TableCell>
                    <TableCell className="text-right font-semibold text-primary text-base">
                      {item.rate}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           <p className="text-xs text-muted-foreground mt-4">
            Disclaimer: These rates are for informational purposes only and are subject to change. Please confirm the rates before placing a bet. Playing Matka is a game of chance and may not be legal in your jurisdiction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
