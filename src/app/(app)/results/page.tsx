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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const results = [
    // Today
  { id: 1, date: "2024-07-26", market: "Kalyan Day", openPanna: "128", openDigit: "1", closePanna: "490", closeDigit: "3", jodi: "13" },
  { id: 2, date: "2024-07-26", market: "Kalyan Night", openPanna: "345", openDigit: "2", closePanna: "678", closeDigit: "1", jodi: "21" },
  // Yesterday
  { id: 3, date: "2024-07-25", market: "Kalyan Day", openPanna: "579", openDigit: "1", closePanna: "224", closeDigit: "8", jodi: "18" },
  { id: 4, date: "2024-07-25", market: "Kalyan Night", openPanna: "112", openDigit: "4", closePanna: "380", closeDigit: "1", jodi: "41" },
  // Day before
  { id: 5, date: "2024-07-24", market: "Kalyan Day", openPanna: "690", openDigit: "5", closePanna: "137", closeDigit: "1", jodi: "51" },
  { id: 6, date: "2024-07-24", market: "Kalyan Night", openPanna: "456", openDigit: "5", closePanna: "789", closeDigit: "4", jodi: "54" },
  { id: 7, date: "2024-07-23", market: "Kalyan Day", openPanna: "248", openDigit: "4", closePanna: "159", closeDigit: "5", jodi: "45" },
  { id: 8, date: "2024-07-23", market: "Kalyan Night", openPanna: "780", openDigit: "5", closePanna: "123", closeDigit: "6", jodi: "56" },
  { id: 9, date: "2024-07-22", market: "Kalyan Day", openPanna: "357", openDigit: "5", closePanna: "889", closeDigit: "5", jodi: "55" },
  { id: 10, date: "2024-07-22", market: "Kalyan Night", openPanna: "168", openDigit: "5", closePanna: "237", closeDigit: "2", jodi: "52" },
  { id: 11, date: "2024-07-21", market: "Kalyan Day", openPanna: "120", openDigit: "3", closePanna: "470", closeDigit: "1", jodi: "31" },
  { id: 12, date: "2024-07-21", market: "Kalyan Night", openPanna: "589", openDigit: "2", closePanna: "349", closeDigit: "6", jodi: "26" },
];

type Result = (typeof results)[0];

// Helper to format date string
const getFormattedDate = (dateString: string) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  if (dateString === todayStr) {
    return 'Today';
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateString === yesterdayStr) {
      return 'Yesterday'
  }
  
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};


const kalyanDayResults = results.filter((r) => r.market.includes("Day")).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
const kalyanNightResults = results.filter((r) => r.market.includes("Night")).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const ResultsList = ({ resultsToShow }: { resultsToShow: Result[] }) => (
  <>
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
          {resultsToShow.map((result) => (
            <TableRow key={result.id}>
              <TableCell className="font-medium">{getFormattedDate(result.date)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    result.market.includes("Night") ? "default" : "secondary"
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
      {resultsToShow.map((result) => (
        <div
          key={result.id}
          className="rounded-lg border bg-card text-card-foreground p-4"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-semibold text-base">{result.market}</p>
              <p className="text-sm text-muted-foreground">{getFormattedDate(result.date)}</p>
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
  </>
);

export default function ResultsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Results History</h1>
        <p className="text-muted-foreground">
          Browse the history of Kalyan Matka results.
        </p>
      </div>

      <Tabs defaultValue="kalyan-day" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kalyan-day">Kalyan Day</TabsTrigger>
          <TabsTrigger value="kalyan-night">Kalyan Night</TabsTrigger>
        </TabsList>
        <TabsContent value="kalyan-day">
          <Card>
            <CardHeader>
              <CardTitle>Kalyan Day Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsList resultsToShow={kalyanDayResults} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="kalyan-night">
          <Card>
            <CardHeader>
              <CardTitle>Kalyan Night Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsList resultsToShow={kalyanNightResults} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
