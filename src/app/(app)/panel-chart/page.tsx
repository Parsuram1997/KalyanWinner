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
      <div className="rounded-lg border">
        <div className="w-full overflow-x-auto">
          <div className="divide-y divide-border">
            {weeklyData.map((week, weekIndex) => (
              <div key={weekIndex} className={`grid grid-cols-7 ${weekIndex === 0 ? 'bg-muted font-semibold' : ''}`}>
                <div className="p-1 text-center flex flex-col items-center justify-center text-xs">
                  {weekIndex === 0 ? (
                    <span className="text-xs">Date</span>
                  ) : (
                    <>
                      <span className="text-[10px]">{week.dateRange.split(" to ")[0]}</span>
                      <span className="text-muted-foreground text-[10px]">to</span>
                      <span className="text-[10px]">{week.dateRange.split(" to ")[1]}</span>
                    </>
                  )}
                </div>
                {week.results.map((day, dayIndex) => (
                  <div key={dayIndex} className="border-l p-1 text-center">
                    {weekIndex === 0 ? (
                      <div className="text-xs">{["MON", "TUE", "WED", "THU", "FRI", "SAT"][dayIndex]}</div>
                    ) : day ? (
                      <div>
                        <div className="text-[10px] text-muted-foreground">{day.openPanna}</div>
                        <div className={`font-bold text-sm my-0.5 ${day.isRed ? "text-destructive" : "text-primary"}`}>{day.jodi}</div>
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
    </div>
  );
}
