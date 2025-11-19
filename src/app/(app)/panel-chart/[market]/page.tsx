
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useMemo, useState } from "react";
import { getYear, getWeek, startOfWeek, endOfWeek, format, eachDayOfInterval, getDay } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

type Result = {
  id: string;
  date: string; // YYYY-MM-DD
  openPanna: string;
  jodi: string;
  closePanna: string;
  marketName: string;
};

type DayResult = {
  openPanna: string;
  jodi: string;
  closePanna: string;
};

type WeekData = {
  dateRange: string;
  results: (DayResult | null)[];
};

const PanelChart = ({ title, marketName }: { title: string, marketName: string }) => {
  const firestore = useFirestore();
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());

  const resultsQuery = useMemoFirebase(() => {
    if (!firestore || !marketName) return null;
    return query(
      collection(firestore, "kalyan_results"),
      where("marketName", "==", marketName),
      orderBy("date", "asc")
    );
  }, [firestore, marketName]);

  const { data: results, isLoading } = useCollection<Result>(resultsQuery);

  const weeklyData = useMemo(() => {
    if (!results) return [];

    const currentYear = new Date().getFullYear();
    let yearToDisplay = currentYear;
    let yearResults = results.filter(r => new Date(r.date).getFullYear() === yearToDisplay);

    // If no results for the current year, try to show the previous year
    if (yearResults.length === 0) {
      yearToDisplay = currentYear - 1;
      yearResults = results.filter(r => new Date(r.date).getFullYear() === yearToDisplay);
    }
    
    setDisplayYear(yearToDisplay);

    const groupedByWeek: { [weekNumber: number]: { [dayOfWeek: number]: DayResult } } = {};

    yearResults.forEach(result => {
        const resultDate = new Date(result.date);
        const weekNumber = getWeek(resultDate, { weekStartsOn: 1 });
        // getDay: Sunday is 0, Monday is 1, etc. We want Monday to be 0.
        const dayOfWeek = (getDay(resultDate) + 6) % 7; 
        
        if (!groupedByWeek[weekNumber]) {
            groupedByWeek[weekNumber] = {};
        }

        groupedByWeek[weekNumber][dayOfWeek] = {
            openPanna: result.openPanna,
            jodi: result.jodi,
            closePanna: result.closePanna,
        };
    });

    const panelData: WeekData[] = [];
    const firstDayOfYear = new Date(yearToDisplay, 0, 1);
    const lastDayOfYear = new Date(yearToDisplay, 11, 31);
    const firstWeek = getWeek(firstDayOfYear, { weekStartsOn: 1 });
    const lastWeek = getWeek(lastDayOfYear, { weekStartsOn: 1 });
    
    const weeksInYear = (lastWeek === 1 && firstDayOfYear.getMonth() === 11) ? 53 : lastWeek;


    for (let weekNum = firstWeek; weekNum <= weeksInYear; weekNum++) {
      const weekIndex = weekNum > 52 ? weekNum - 52 : weekNum;
      
      const firstDayOfWeek = startOfWeek(new Date(yearToDisplay, 0, (weekIndex - 1) * 7 + 1), { weekStartsOn: 1 });
      
      const weekResults: (DayResult | null)[] = [];
      const weekDays = eachDayOfInterval({start: firstDayOfWeek, end: endOfWeek(firstDayOfWeek, {weekStartsOn: 1})}).slice(0,6);

      for(const day of weekDays) {
         const dayOfWeek = (getDay(day) + 6) % 7;
         const weekNumberForDay = getWeek(day, { weekStartsOn: 1 });
         
         if (groupedByWeek[weekNumberForDay] && groupedByWeek[weekNumberForDay][dayOfWeek]) {
             weekResults.push(groupedByWeek[weekNumberForDay][dayOfWeek]);
         } else {
             weekResults.push(null);
         }
      }

      if (weekResults.some(r => r !== null)) {
          panelData.push({
            dateRange: `${format(firstDayOfWeek, 'dd/MM/yy')} to ${format(endOfWeek(firstDayOfWeek, {weekStartsOn: 1}), 'dd/MM/yy')}`,
            results: weekResults,
          });
      }
    }

    return panelData.reverse();
  }, [results]);

  const isRedJodi = (jodi: string) => {
    if (!jodi || jodi.length !== 2) return false;
    return jodi[0] === jodi[1];
  };

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{marketName} Panel Chart {displayYear}</h1>
        <p className="text-muted-foreground">
          Yearly results for the {marketName} Matka game.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{title} {displayYear}</CardTitle>
          <CardDescription>A yearly record of game results.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="w-full h-96" /> : weeklyData.length === 0 ? <p className="text-center text-muted-foreground p-8">No results found for this market in {displayYear}.</p> : (
              <div className="rounded-lg border">
              <div className="w-full overflow-x-auto">
                  <div className="divide-y divide-border">
                  <div className="grid grid-cols-[auto_repeat(6,1fr)] bg-muted font-semibold">
                      <div className="p-1 text-center flex items-center justify-center text-xs shrink-0 w-[80px]">Date</div>
                      <div className="border-l p-1 text-center text-xs">MON</div>
                      <div className="border-l p-1 text-center text-xs">TUE</div>
                      <div className="border-l p-1 text-center text-xs">WED</div>
                      <div className="border-l p-1 text-center text-xs">THU</div>
                      <div className="border-l p-1 text-center text-xs">FRI</div>
                      <div className="border-l p-1 text-center text-xs">SAT</div>
                  </div>
                  {weeklyData.map((week, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-[auto_repeat(6,1fr)]">
                      <div className="p-1 text-center flex flex-col items-center justify-center text-xs shrink-0 w-[80px]">
                          <span className="text-[10px]">{week.dateRange.split(" to ")[0]}</span>
                          <span className="text-muted-foreground text-[10px]">to</span>
                          <span className="text-[10px]">{week.dateRange.split(" to ")[1]}</span>
                      </div>
                      {week.results.map((day, dayIndex) => (
                          <div key={dayIndex} className="border-l p-1 text-center">
                          {day ? (
                              <div>
                              <div className="text-[10px] text-muted-foreground">{day.openPanna}</div>
                              <div className={`font-bold text-xs my-0.5 ${isRedJodi(day.jodi) ? "text-destructive" : "text-primary"}`}>{day.jodi === 'L' ? <span className="text-destructive">H</span> : day.jodi}</div>
                              <div className="text-[10px] text-muted-foreground">{day.closePanna}</div>
                              </div>
                          ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground text-lg">
                              *
                              </div>
                          )}
                          </div>
                      ))}
                      </div>
                  ))}
                  </div>
              </div>
              </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default function PanelChartPage() {
  const params = useParams();
  const marketSlug = params.market as string;
  const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="flex flex-col gap-6">
      <PanelChart title={`${marketName} Chart`} marketName={marketName} />
    </div>
  );
}
