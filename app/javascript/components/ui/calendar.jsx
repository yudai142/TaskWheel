import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3",
        caption: "grid grid-cols-3 items-center gap-4 pt-2 pb-3 px-2",
        caption_label: "text-lg font-bold text-gray-900 text-center col-span-1",
        nav: "col-span-1 flex justify-center",
        nav_button: cn(
          "h-9 w-9 p-0 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center",
          "opacity-100"
        ),
        nav_button_previous: "order-first",
        nav_button_next: "order-last",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell:
          "text-gray-600 rounded-md w-10 h-10 font-semibold text-sm flex items-center justify-center bg-gray-50 font-medium",
        row: "flex w-full mt-1",
        cell: "h-10 w-10 text-center text-sm p-0 relative",
        day: "h-10 w-10 p-0 font-normal rounded-lg text-gray-700 hover:bg-blue-100 hover:text-gray-900 transition-colors",
        day_range_end: "day-range-end",
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 font-semibold rounded-lg",
        day_today: "bg-blue-50 text-blue-600 font-bold border border-blue-200",
        day_outside:
          "text-gray-400 opacity-60",
        day_disabled: "text-gray-300 opacity-50",
        day_range_middle:
          "bg-blue-50 text-gray-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <ChevronLeft className="h-4 w-4" {...props} />
        ),
        IconRight: ({ ...props }) => (
          <ChevronRight className="h-4 w-4" {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
