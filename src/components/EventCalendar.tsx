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

function getWeekendBlock(date: Date): string[] {
  const day = getDay(date);
  let friday: Date;
  if (day === 5) friday = date;
  else if (day === 6) friday = subDays(date, 1);
  else friday = subDays(date, 2);
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
    const blockIsUnavailable = block.every((d) => myUnavailable.has(d));
    if (blockIsUnavailable) {
      toggleBlock.mutate({ name: currentUser, dates: block, isUnavailable: true });
    } else {
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

        // Build rows of 7 cells (including leading empty cells)
        const totalCells = firstDayOffset + days.length;
        const rows = Math.ceil(totalCells / 7);

        return (
          <div key={month.toISOString()} className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-center text-sm font-semibold capitalize">
              {format(month, "MMMM yyyy", { locale: es })}
            </h3>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center text-xs mb-1">
              {dayNames.map((d) => (
                <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>
              ))}
            </div>

            {/* Calendar rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => {
              const cellsInRow = Array.from({ length: 7 }).map((_, colIdx) => {
                const cellIndex = rowIdx * 7 + colIdx;
                const dayIndex = cellIndex - firstDayOffset;
                if (dayIndex < 0 || dayIndex >= days.length) return null;
                return days[dayIndex];
              });

              // Find if this row has a weekend block (Vi=col4, Sá=col5, Do=col6)
              const fri = cellsInRow[4];
              const sat = cellsInRow[5];
              const sun = cellsInRow[6];
              const hasWeekendBlock = fri || sat || sun;

              // Determine block state for the wrapper border
              const blockDates = [fri, sat, sun].filter(Boolean) as Date[];
              const blockDateStrs = blockDates.map((d) => format(d, "yyyy-MM-dd"));
              const blockIsUnavailable = blockDateStrs.length > 0 && blockDateStrs.every((d) => myUnavailable.has(d));
              const blockIsPartial = !blockIsUnavailable && blockDateStrs.some((d) => myUnavailable.has(d));

              return (
                <div key={rowIdx} className="grid grid-cols-7 mb-1">
                  {/* Mon–Thu cells (cols 0–3) */}
                  {cellsInRow.slice(0, 4).map((date, colIdx) => {
                    if (!date) return <div key={colIdx} />;
                    return (
                      <div
                        key={colIdx}
                        className="flex h-9 items-center justify-center text-xs text-muted-foreground/40"
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}

                  {/* Weekend block wrapper (cols 4–6) */}
                  {hasWeekendBlock ? (
                    <div
                      className={cn(
                        "col-span-3 flex rounded-xl border-2 overflow-hidden cursor-pointer transition-all",
                        blockIsUnavailable
                          ? "border-destructive bg-destructive"
                          : blockIsPartial
                          ? "border-primary/60 bg-weekend-available"
                          : "border-primary/30 bg-weekend-available hover:border-primary/60 hover:bg-weekend-hover"
                      )}
                      onClick={() => fri ? handleClick(fri) : sat ? handleClick(sat) : sun && handleClick(sun)}
                    >
                      {[fri, sat, sun].map((date, i) => {
                        if (!date) return <div key={i} className="flex-1" />;
                        const dateStr = format(date, "yyyy-MM-dd");
                        const isMyUnavailable = myUnavailable.has(dateStr);
                        const count = unavailableCount(dateStr);
                        return (
                          <div
                            key={i}
                            className={cn(
                              "relative flex flex-1 h-9 items-center justify-center text-xs font-medium",
                              blockIsUnavailable
                                ? "text-destructive-foreground"
                                : "text-foreground"
                            )}
                          >
                            {date.getDate()}
                            {count > 0 && (
                              <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                                {count}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      <div />
                      <div />
                      <div />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
