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

const results = [
  {
    id: 1,
    date: "2024-07-20",
    market: "Kalyan Morning",
    openPanna: "128",
    openDigit: "1",
    closePanna: "490",
    closeDigit: "3",
    jodi: "13",
  },
  {
    id: 2,
    date: "2024-07-19",
    market: "Kalyan Night",
    openPanna: "345",
    openDigit: "2",
    closePanna: "678",
    closeDigit: "1",
    jodi: "21",
  },
  {
    id: 3,
    date: "2024-07-19",
    market: "Kalyan Morning",
    openPanna: "579",
    openDigit: "1",
    closePanna: "224",
    closeDigit: "8",
    jodi: "18",
  },
  {
    id: 4,
    date: "2024-07-18",
    market: "Kalyan Night",
    openPanna: "112",
    openDigit: "4",
    closePanna: "380",
    closeDigit: "1",
    jodi: "41",
  },
  {
    id: 5,
    date: "2024-07-18",
    market: "Kalyan Morning",
    openPanna: "690",
    openDigit: "5",
    closePanna: "137",
    closeDigit: "1",
    jodi: "51",
  },
  {
    id: 6,
    date: "2024-07-17",
    market: "Kalyan Night",
    openPanna: "456",
    openDigit: "5",
    closePanna: "789",
    closeDigit: "4",
    jodi: "54",
  },
];

export default function ResultsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Results History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Past Results</CardTitle>
          <CardDescription>
            Browse the history of Kalyan Matka results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Open Panna</TableHead>
                <TableHead>Jodi</TableHead>
                <TableHead>Close Panna</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        result.market.includes("Night")
                          ? "default"
                          : "secondary"
                      }
                    >
                      {result.market}
                    </Badge>
                  </TableCell>
                  <TableCell>{result.openPanna}</TableCell>
                  <TableCell>
                    <div className="font-bold text-lg text-primary">
                      {result.jodi}
                    </div>
                  </TableCell>
                  <TableCell>{result.closePanna}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
