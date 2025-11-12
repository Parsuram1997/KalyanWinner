import { getPanelChartData } from "@/lib/panel-chart-data";

export default function PanelChartPage() {
  const weeklyData = getPanelChartData();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Kalyan Panel Chart 2023</h1>
        <p className="text-muted-foreground">
          Yearly results for Kalyan Matka games.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-max">
          {weeklyData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col border-b last:border-b-0">
              <div className="flex">
                <div className="w-28 flex-shrink-0 bg-muted p-1 text-center font-semibold text-sm">
                  Date
                </div>
                {["MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                  <div key={day} className="flex-1 border-l bg-muted p-1 text-center font-semibold text-sm">
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex">
                <div className="w-28 flex-shrink-0 flex items-center justify-center p-1 text-xs text-center text-muted-foreground">
                  {week.dateRange}
                </div>
                {week.results.map((day, dayIndex) => (
                  <div key={dayIndex} className="flex-1 border-l text-center p-1">
                    {day ? (
                      <div>
                        <div className="text-xs text-muted-foreground">{day.openPanna}</div>
                        <div className={`font-bold text-xl my-0.5 ${day.isRed ? "text-destructive" : "text-primary"}`}>{day.jodi}</div>
                        <div className="text-xs text-muted-foreground">{day.closePanna}</div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-lg">
                        *
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
