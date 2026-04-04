"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowDownIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@timesheet/ui/components/button";
import { cn } from "@timesheet/ui/lib/utils";
import * as React from "react";
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import type { DayButton, Locale } from 'react-day-picker';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-4 w-full [--cell-radius:0px] [--cell-size:--spacing(12)]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-12 p-0 select-none aria-disabled:opacity-50 rounded-none hover:bg-foreground hover:text-background transition-colors active:scale-95",
          defaultClassNames.button_next
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-12 p-0 select-none aria-disabled:opacity-50 rounded-none hover:bg-foreground hover:text-background transition-colors active:scale-95",
          defaultClassNames.button_previous
        ),
        caption_label: cn(
          "font-black uppercase tracking-widest select-none text-lg",
          captionLayout === "label"
            ? "text-lg"
            : "flex items-center gap-1 text-lg [&>svg]:size-5 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full p-0 text-center select-none",
          defaultClassNames.day
        ),
        disabled: cn(
          "text-muted-foreground opacity-30",
          defaultClassNames.disabled
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown
        ),
        dropdown_root: cn(
          "relative",
          defaultClassNames.dropdown_root
        ),
        dropdowns: cn(
          "flex h-12 w-full items-center justify-center gap-2 text-base font-black uppercase",
          defaultClassNames.dropdowns
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        month: cn("flex w-full flex-col gap-6", defaultClassNames.month),
        month_caption: cn(
          "flex h-12 w-full items-center justify-center",
          defaultClassNames.month_caption
        ),
        months: cn(
          "relative flex flex-col gap-6 w-full",
          defaultClassNames.months
        ),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground opacity-30",
          defaultClassNames.outside
        ),
        range_end: cn(
          "relative isolate z-0 bg-foreground text-background",
          defaultClassNames.range_end
        ),
        range_middle: cn("rounded-none bg-foreground/10", defaultClassNames.range_middle),
        range_start: cn(
          "relative isolate z-0 bg-foreground text-background",
          defaultClassNames.range_start
        ),
        root: cn("w-full", defaultClassNames.root),
        table: "w-full border-collapse border-spacing-0",
        today: cn(
          "bg-foreground/5 text-foreground",
          defaultClassNames.today
        ),
        week: cn("flex w-full border-b border-foreground/10 last:border-0", defaultClassNames.week),
        week_number: cn(
          "text-xs text-muted-foreground select-none font-black",
          defaultClassNames.week_number
        ),
        week_number_header: cn(
          "w-10 select-none",
          defaultClassNames.week_number_header
        ),
        weekday: cn(
          "flex-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground select-none border-b border-foreground/10 pb-4 mb-2",
          defaultClassNames.weekday
        ),
        weekdays: cn("flex w-full", defaultClassNames.weekdays),
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <HugeiconsIcon
                icon={ArrowLeftIcon}
                strokeWidth={2.5}
                className={cn("size-6", className)}
                {...props}
              />
            );
          }

          if (orientation === "right") {
            return (
              <HugeiconsIcon
                icon={ArrowRightIcon}
                strokeWidth={2.5}
                className={cn("size-6", className)}
                {...props}
              />
            );
          }

          return (
            <HugeiconsIcon
              icon={ArrowDownIcon}
              strokeWidth={2.5}
              className={cn("size-6", className)}
              {...props}
            />
          );
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        Root: ({ className, rootRef, ...props }) => (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          ),
        WeekNumber: ({ children, ...props }) => (
            <td {...props}>
              <div className="flex size-10 items-center justify-center text-center font-black">
                {children}
              </div>
            </td>
          ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) {ref.current?.focus();}
  }, [modifiers.focused]);

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-10 flex-col gap-1 border-r border-foreground/10 last:border-r-0 leading-none font-bold text-lg sm:text-xl group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-foreground group-data-[focused=true]/day:ring-inset data-[range-end=true]:bg-foreground data-[range-end=true]:text-background data-[range-middle=true]:bg-foreground/10 data-[range-middle=true]:text-foreground data-[range-start=true]:bg-foreground data-[range-start=true]:text-background data-[selected-single=true]:bg-foreground data-[selected-single=true]:text-background hover:bg-foreground hover:text-background transition-colors rounded-none [&>span]:text-xs [&>span]:opacity-70 active:scale-95",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };