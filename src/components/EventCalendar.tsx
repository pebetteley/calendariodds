import { useMemo, useState } from "react";
import { useEventResponses, useToggleWeekendBlock } from "@/hooks/useEventResponses";
import { useSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import {
  format, eachDayOfInterval, getDay, startOfMonth, endOfMonth,
  eachMonthOfInterval, addDays, subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CheckCircle2, X, Users } from "lucide-react";

interface EventCalendarProps { currentUser: string; }

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
  return [format(friday, "yyyy-MM-dd"), format(addDays(friday, 1), "yyyy-MM-dd"), format(addDays(friday, 2), "yyyy-MM-dd")];
}

// Heatmap color based on availability percentage
function heatColor(pct: number, isUnavailable: boolean): string {
  if (isUnavailable) return "bg-destructive/15 border-destructive/40 text-destructive";
  if (pct >= 90) return "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-400";
  if (pct >= 70) return "bg-emerald-400/12 border-emerald-400/40 text-emerald-600 dark:text-emerald-500";
  if (pct >= 50) return "bg-amber-400/12 border-amber-400/40 text-amber-700 dark:text-amber-400";
  if (pct >= 30) return "bg-orange-400/12 border-orange-400/40 text-orange-700 dark:text-orange-400";
  return "bg-red-400/12 border-red-400/40 text-red-700 dark:text-red-400";
}

interface TooltipData { available: string[]; unavailable: string[]; }

export function EventCalendar({ currentUser }: EventCalendarProps) {
  const { data: responses = [] } = useEventResponses();
  const { data: settings } = useSiteSettings();
  const toggleBlock = useToggleWeekendBlock();
  const [tooltip, setTooltip] = useState<{ blockKey: string; data: TooltipData } | null>(null);

  const months = useMemo(() => {
    const { start, end } = getDateRange(settings);
    return eachMonthOfInterval({ start, end });
  }, [settings]);

  const myUnavailable = useMemo(
    () => new Set(responses.filter((r) => r.person_name === currentUser).map((r) => r.unavailable_date)),
    [responses, currentUser]
  );

  const allPeople = useMemo(
    () => [...new Set(responses.map((r) => r.person_name))].filter((n) => n !== "admin123"),
    [responses]
  );

  const unavailableByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of responses) {
      if (r.person_name === "admin123") continue;
      if (!map.has(r.unavailable_date)) map.set(r.unavailable_date, []);
      map.get(r.unavailable_date)!.push(r.person_name);
    }
    return map;
  }, [responses]);

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

  const getBlockTooltip = (blockDates: string[]): TooltipData => {
    const unavailableSet = new Set(blockDates.flatMap((d) => unavailableByDate.get(d) ?? []));
    const unavailable = [...unavailableSet];
    const available = allPeople.filter((p) => !unavailableSet.has(p));
    return { available, unavailable };
  };

  const dayNames = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

  return (
    <div className="space-y-4">
      {/* Legend */}
      {allPeople.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-500/20 border border-emerald-500/50" />Todos pueden</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-400/20 border border-amber-400/50" />Algunos no pueden</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-red-400/20 border border-red-400/50" />Mayoría no puede</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-destructive/15 border border-destructive/40" />Tú no puedes</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((month, monthIdx) => {
          const start = startOfMonth(month);
          const end = endOfMonth(month);
          const days = eachDayOfInterval({ start, end });
          const firstDayOffset = (getDay(start) + 6) % 7;
          const totalCells = firstDayOffset + days.length;
          const rows = Math.ceil(totalCells / 7);

          return (
            <div
              key={month.toISOString()}
              className="glass rounded-2xl p-5 shadow-sm animate-fade-up"
              style={{ animationDelay: `${monthIdx * 0.05}s` }}
            >
              <h3 className="mb-4 text-center text-sm font-semibold capitalize tracking-wide text-foreground/80">
                {format(month, "MMMM yyyy", { locale: es })}
              </h3>

              <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground mb-1">
                {dayNames.map((d) => <div key={d} className="py-1">{d}</div>)}
              </div>

              {Array.from({ length: rows }).map((_, rowIdx) => {
                const cellsInRow = Array.from({ length: 7 }).map((_, colIdx) => {
                  const dayIndex = rowIdx * 7 + colIdx - firstDayOffset;
                  if (dayIndex < 0 || dayIndex >= days.length) return null;
                  return days[dayIndex];
                });

                const fri = cellsInRow[4];
                const sat = cellsInRow[5];
                const sun = cellsInRow[6];
                const hasWeekend = fri || sat || sun;
                const blockDates = [fri, sat, sun].filter(Boolean) as Date[];
                const blockDateStrs = blockDates.map((d) => format(d, "yyyy-MM-dd"));
                const myBlockUnavailable = blockDateStrs.length > 0 && blockDateStrs.every((d) => myUnavailable.has(d));

                // Heatmap: what % of people are available for this block?
                const unavailableNames = new Set(blockDateStrs.flatMap((d) => unavailableByDate.get(d) ?? []));
                const availablePct = allPeople.length > 0
                  ? Math.round(((allPeople.length - unavailableNames.size) / allPeople.length) * 100)
                  : 100;

                const blockKey = blockDateStrs.join("-");
                const isHovered = tooltip?.blockKey === blockKey;
                const tooltipData = tooltip?.data;

                return (
                  <div key={rowIdx} className="grid grid-cols-7 mb-1">
                    {/* Mon–Thu */}
                    {cellsInRow.slice(0, 4).map((date, colIdx) => (
                      <div key={colIdx} className="flex h-9 items-center justify-center text-xs text-muted-foreground/35 font-medium">
                        {date?.getDate()}
                      </div>
                    ))}

                    {/* Weekend block */}
                    {hasWeekend ? (
                      <div className="col-span-3 relative">
                        <button
                          disabled={toggleBlock.isPending}
                          onClick={() => fri ? handleClick(fri) : sat ? handleClick(sat) : sun && handleClick(sun)}
                          onMouseEnter={() => allPeople.length > 0 && setTooltip({ blockKey, data: getBlockTooltip(blockDateStrs) })}
                          onMouseLeave={() => setTooltip(null)}
                          className={cn(
                            "w-full flex rounded-xl border-2 overflow-hidden transition-all duration-200 cursor-pointer",
                            "hover:scale-[1.03] hover:shadow-md active:scale-[0.98]",
                            myBlockUnavailable
                              ? "bg-destructive/15 border-destructive/40 shadow-destructive/10"
                              : allPeople.length > 0
                              ? cn(heatColor(availablePct, false), "hover:brightness-105")
                              : "bg-weekend-available border-[hsl(var(--weekend-block-border))] hover:bg-weekend-hover"
                          )}
                        >
                          {[fri, sat, sun].map((date, i) => {
                            if (!date) return <div key={i} className="flex-1" />;
                            const dateStr = format(date, "yyyy-MM-dd");
                            const isMe = myUnavailable.has(dateStr);
                            return (
                              <div key={i} className={cn(
                                "relative flex flex-1 h-9 items-center justify-center text-xs font-semibold",
                                myBlockUnavailable ? "text-destructive" : "text-foreground/80"
                              )}>
                                {date.getDate()}
                                {isMe && (
                                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                                )}
                              </div>
                            );
                          })}
                        </button>

                        {/* Availability badge */}
                        {allPeople.length > 0 && (
                          <div className={cn(
                            "absolute -top-2 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm",
                            availablePct >= 70 ? "bg-emerald-500" : availablePct >= 40 ? "bg-amber-500" : "bg-red-500"
                          )}>
                            {availablePct}%
                          </div>
                        )}

                        {/* Tooltip */}
                        {isHovered && tooltipData && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44 rounded-xl border bg-card shadow-xl p-3 text-xs animate-scale-in pointer-events-none">
                            {tooltipData.available.length > 0 && (
                              <div className="mb-2">
                                <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                                  <CheckCircle2 className="h-3 w-3" /> Pueden ({tooltipData.available.length})
                                </div>
                                {tooltipData.available.map((n) => (
                                  <div key={n} className="truncate text-muted-foreground pl-4">{n}</div>
                                ))}
                              </div>
                            )}
                            {tooltipData.unavailable.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 font-semibold text-destructive mb-1">
                                  <X className="h-3 w-3" /> No pueden ({tooltipData.unavailable.length})
                                </div>
                                {tooltipData.unavailable.map((n) => (
                                  <div key={n} className="truncate text-muted-foreground pl-4">{n}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <><div /><div /><div /></>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
