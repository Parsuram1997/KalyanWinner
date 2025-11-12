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
          {/* Desktop Table */}
          <div className="hidden md:block">
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
          </div>

          {/* Mobile List */}
          <div className="grid gap-4 md:hidden">
            {results.map((result) => (
              <div
                key={result.id}
                className="rounded-lg border bg-card text-card-foreground p-4"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold text-base">{result.market}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.date}
                    </p>
                  </div>
                  <Badge
                    variant={
                      result.market.includes("Night") ? "default" : "secondary"
                    }
                  >
                    {result.market.split(" ")[1]}
                  </Badge>
                </div>
                <div className="flex items-center justify-around text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">Open</span>
                    <span className="text-lg font-bold tracking-widest">
                      {result.openPanna}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-md bg-primary px-3 py-1 text-primary-foreground">
                    <span className="text-2xl font-bold tracking-wider">
                      {result.jodi}
                    </span>
                    <span className="text-[10px] font-medium">Jodi</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">Close</span>
                    <span className="text-lg font-bold tracking-widest">
                      {result.closePanna}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
