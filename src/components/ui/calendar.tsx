
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"
import { format, getMonth, getYear } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "./scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const selectedDate = props.selected as Date | undefined;
  const headerDate = selectedDate || new Date();

  return (
    <div className={cn("rounded-md border bg-card", className)}>
       <div className="bg-primary text-primary-foreground p-4 rounded-t-md">
        <div className="text-sm font-medium opacity-80">SELECT DATE</div>
        <div className="text-2xl font-bold mt-1">
          {format(headerDate, "EEE, MMM d")}
        </div>
      </div>
      <div className="p-3">
        <DayPicker
          showOutsideDays={showOutsideDays}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-between pt-1 relative items-center px-1",
            caption_label: "text-sm font-medium hidden", // Hide default label, we use dropdowns
            caption_dropdowns: "flex items-center gap-1",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex justify-between",
            head_cell:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2 justify-between",
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
            Dropdown: ({ value, onChange, children, ...props }: DropdownProps) => {
              const options = React.Children.toArray(children) as React.ReactElement<React.HTMLProps<HTMLOptionElement>>[];
              const selected = options.find((child) => child.props.value === value);
              const handleChange = (value: string) => {
                const changeEvent = {
                  target: { value },
                } as React.ChangeEvent<HTMLSelectElement>;
                onChange?.(changeEvent);
              };
              return (
                <Select
                  value={value?.toString()}
                  onValueChange={(value) => {
                    handleChange(value);
                  }}
                >
                  <SelectTrigger className="pr-1.5 focus:ring-0 h-8 text-xs w-[6rem]">
                    <SelectValue>{selected?.props?.children}</SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <ScrollArea className="h-48">
                      {options.map((option, id: number) => (
                        <SelectItem
                          key={`${id}`}
                          value={option.props.value?.toString() ?? ""}
                        >
                          {option.props.children}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
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
