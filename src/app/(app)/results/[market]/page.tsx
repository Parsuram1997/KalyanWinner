
"use client";

import {
  Card,
  CardContent,
  CardFooter,
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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

type Result = { 
  id: string;
  date: string;
  marketName: string;
  openPanna?: string;
  closePanna?: string;
  jodi?: string;
};

const RESULTS_PER_PAGE = 30;

// Helper to get digit from panna
const getDigit = (panna?: string) => {
  if (!panna || panna.length !== 3) return "*";
  return String(panna.split('').reduce((sum, digit) => sum + parseInt(digit), 0) % 10);
};

// Helper to format date string
const getFormattedDate = (dateString: string) => {
  if (!dateString) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const resultDate = new Date(dateString);
  resultDate.setHours(0, 0, 0, 0);

  if (resultDate.getTime() === today.getTime()) {
    return 'Today';
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (resultDate.getTime() === yesterday.getTime()) {
      return 'Yesterday'
  }
  
  const [year, month, day] = dateString.split('-');
  if(!day || !month || !year) return dateString;
  return `${day}/${month}/${year}`;
};


export default function MarketResultsPage() {
  const params = useParams();
  const marketSlug = params.market as string;
  const [currentPage, setCurrentPage] = useState(1);
  
  let marketName = "";
  if (marketSlug) {
    if (marketSlug === 'main-bazar') {
      marketName = 'Main Bazar';
    } else {
      marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  }

  const firestore = useFirestore();
  
  const resultsQuery = useMemoFirebase(() => 
    (firestore && marketName) 
      ? query(
          collection(firestore, "kalyan_results"), 
          where("marketName", "==", marketName), 
          orderBy("date", "desc")
        ) 
      : null, 
    [firestore, marketName]
  );
  
  const { data: results, isLoading } = useCollection<Result>(resultsQuery, { skip: !firestore || !marketName });

  const { paginatedResults, totalPages } = useMemo(() => {
    if (!results) return { paginatedResults: [], totalPages: 0 };
    const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    return { paginatedResults: results.slice(startIndex, endIndex), totalPages };
  }, [results, currentPage]);
  
  if (!marketSlug) {
      return <div>Loading market...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{marketName} Results</h1>
        <p className="text-sm text-muted-foreground">
          History of all declared results for this market.
        </p>
      </div>
      
       <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
            <CardContent className="p-0">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full bg-white/20" />)}
                  </div>
                ) : !results || results.length === 0 ? (
                  <p className="text-center text-white/80 py-8">No results found for this market.</p>
                ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-md border border-white/20">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-white/20">
                          <TableHead className="text-white">Date</TableHead>
                          <TableHead className="text-center text-white">Open Panna</TableHead>
                          <TableHead className="text-center text-white">Jodi</TableHead>
                          <TableHead className="text-center text-white">Close Panna</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedResults.map((result) => (
                            <TableRow key={result.id} className="border-white/20">
                              <TableCell className="font-medium py-1.5">{getFormattedDate(result.date)}</TableCell>
                              <TableCell className="text-center font-mono tracking-widest py-1.5">{result.openPanna || '***'}</TableCell>
                              <TableCell className="text-center py-1.5">
                                <div className="font-bold text-lg">
                                  {result.jodi === 'L' ? <Badge variant="destructive">HOLIDAY</Badge> : <span className="text-white">{result.jodi || `**`}</span>}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono tracking-widest py-1.5">{result.closePanna || '***'}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile List */}
                   <div className="grid gap-0 md:hidden">
                    {paginatedResults.map((result, index) => {
                      return (
                        <div
                          key={result.id}
                          className={cn(
                            "px-4 py-3 bg-gradient-to-br from-blue-600 to-purple-700 text-white",
                            index < paginatedResults.length - 1 && "border-b border-white/20"
                          )}
                        >
                          <div className="flex justify-between items-center">
                             <div>
                              <p className="font-semibold text-base">{result.marketName}</p>
                              <p className="text-sm text-white/80">{getFormattedDate(result.date)}</p>
                            </div>
                             <div className="flex items-center justify-center gap-2">
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-white/80">Open</span>
                                <span className="text-xl font-bold tracking-widest">{result.openPanna || '***'}</span>
                              </div>
                              <div className="flex flex-col items-center rounded-md bg-white px-3 py-1 text-slate-900">
                                {result.jodi === 'L' ? <span className="text-sm font-bold">Holiday</span> : <span className="text-2xl font-bold tracking-wider">{result.jodi || '**'}</span>}
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-white/80">Close</span>
                                <span className="text-xl font-bold tracking-widest">{result.closePanna || '***'}</span>
                              </div>
                          </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
                )}
            </CardContent>
             {totalPages > 1 && (
             <CardFooter className="flex justify-end items-center gap-4 border-t border-white/20 pt-4">
                <span className="text-sm text-white/80">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-transparent text-white hover:bg-white/10"
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-transparent text-white hover:bg-white/10"
                >
                    Next
                </Button>
            </CardFooter>
          )}
        </Card>
    </div>
  );
}
