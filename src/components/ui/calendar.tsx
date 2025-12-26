"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const selectedDate = props.selected as Date | undefined;
  const [currentMonth, setCurrentMonth] = React.useState(props.month || new Date());

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    if (props.onMonthChange) {
      props.onMonthChange(month);
    }
  };

  return (
    <div className={cn("rounded-md border bg-card", className)}>
       <div className="bg-primary text-primary-foreground p-4 rounded-t-md">
        <div className="text-sm font-medium opacity-80">SELECT DATE</div>
        <div className="text-2xl font-bold mt-1">
          {format(selectedDate || new Date(), "EEE, MMM d")}
        </div>
      </div>
      <div className="p-3">
        <DayPicker
          showOutsideDays={showOutsideDays}
          className="p-0"
          month={currentMonth}
          onMonthChange={handleMonthChange}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-between pt-1 relative items-center px-1",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hidden"
            ),
            nav_button_previous: "",
            nav_button_next: "",
            table: "w-full border-collapse space-y-1",
            head_row: "flex w-full mt-2",
            head_cell:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] justify-center",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside:
              "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
            ...classNames,
          }}
          components={{
            IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
            IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
            Caption: ({ displayMonth }) => {
              const currentYear = new Date().getFullYear();
              const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
              const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ];
              
              return (
                <div className="flex justify-between items-center w-full">
                  <Select
                    value={months[displayMonth.getMonth()]}
                    onValueChange={(month) => {
                      const newMonth = new Date(displayMonth);
                      newMonth.setMonth(months.indexOf(month));
                      handleMonthChange(newMonth);
                    }}
                  >
                    <SelectTrigger className="w-auto border-0">
                      <SelectValue>{months[displayMonth.getMonth()]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, i) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={displayMonth.getFullYear().toString()}
                    onValueChange={(year) => {
                      const newMonth = new Date(displayMonth);
                      newMonth.setFullYear(parseInt(year));
                      handleMonthChange(newMonth);
                    }}
                  >
                    <SelectTrigger className="w-auto border-0">
                      <SelectValue>{displayMonth.getFullYear()}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            },
          }}
          {...props}
        />
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }