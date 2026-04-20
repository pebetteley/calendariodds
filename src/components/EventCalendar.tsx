import { useMemo } from "react";
import { useEventResponses, useToggleWeekendBlock } from "@/hooks/useEventResponses";
import { useSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import {
  format,
  eachDayOfInterval,
  getDay,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  addDays,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EventCalendarProps {
  currentUser: string;
}

function isWeekend(date: Date) {
  const day = getDay(date);
  return day === 5 || day === 6 || day === 0;
}

/** Given any Fri/Sat/Sun, return the [Fri, Sat, Sun] block as yyyy-MM-dd strings */
function getWeekendBlock(date: Date): string[] {
  const day = getDay(date);
  let friday: Date;
  if (day === 5) friday = date;
  else if (day === 6) friday = subDays(date, 1);
  else friday = subDays(date, 2); // Sunday
  const sat = addDays(friday, 1);
  const sun = addDays(friday, 2);
  return [format(friday, "yyyy-MM-dd"), format(sat, "yyyy-MM-dd"), format(sun, "yyyy-MM-dd")];
}

export function EventCalendar({ currentUser }: EventCalendarProps) {
  const { data: responses = [] } = useEventResponses();
  const { data: settings } = useSiteSettings();
  const toggleBlock = useToggleWeekendBlock();

  const months = useMemo(() => {
    const { start, end } = getDateRange(settings);
    return eachMonthOfInterval({ start, end });
  }, [settings]);

  const myUnavailable = useMemo(
    () => new Set(responses.filter((r) => r.person_name === currentUser).map((r) => r.unavailable_date)),
    [responses, currentUser]
  );

  const handleClick = (date: Date) => {
    if (!isWeekend(date)) return;
    const block = getWeekendBlock(date);
    // Block is considered "unavailable" only if ALL dates in the block are marked
    const blockIsUnavailable = block.every((d) => myUnavailable.has(d));
    if (blockIsUnavailable) {
      // Remove all dates in the block
      toggleBlock.mutate({ name: currentUser, dates: block, isUnavailable: true });
    } else {
      // Only insert dates not already marked
      const datesToAdd = block.filter((d) => !myUnavailable.has(d));
      toggleBlock.mutate({ name: currentUser, dates: datesToAdd, isUnavailable: false });
    }
  };

  const unavailableCount = (dateStr: string) =>
    responses.filter((r) => r.unavailable_date === dateStr).length;

  const dayNames = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {months.map((month) => {
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        const days = eachDayOfInterval({ start, end });
        const firstDayOffset = (getDay(start) + 6) % 7;

        return (
          <div key={month.toISOString()} className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-center text-sm font-semibold capitalize">
              {format(month, "MMMM yyyy", { locale: es })}
            </h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {dayNames.map((d) => (
                <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const weekend = isWeekend(date);
                const day = getDay(date);
                const isMyUnavailable = myUnavailable.has(dateStr);
                const count = weekend ? unavailableCount(dateStr) : 0;

                // Block grouping border classes (Fri=left, Sat=middle, Sun=right)
                const isFri = day === 5;
                const isSat = day === 6;
                const isSun = day === 0;
                const blockBorder = weekend
                  ? cn(
                      "border-y-2",
                      isFri && "border-l-2 rounded-l-md -mr-1",
                      isSat && "-mx-1 rounded-none",
                      isSun && "border-r-2 rounded-r-md -ml-1",
                      isMyUnavailable
                        ? "border-[hsl(var(--weekend-block-border-unavailable))]"
                        : "border-[hsl(var(--weekend-block-border))]"
                    )
                  : "";

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleClick(date)}
                    disabled={!weekend || toggleBlock.isPending}
                    className={cn(
                      "relative flex h-9 w-full items-center justify-center text-xs transition-all",
                      !weekend && "rounded-md text-muted-foreground/40 cursor-default",
                      weekend && !isMyUnavailable && "bg-weekend-available hover:bg-weekend-hover cursor-pointer font-medium",
                      weekend && isMyUnavailable && "bg-destructive text-destructive-foreground cursor-pointer font-bold",
                      blockBorder,
                    )}
                  >
                    {date.getDate()}
                    {weekend && count > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
