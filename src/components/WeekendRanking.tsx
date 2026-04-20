import { useMemo } from "react";
import { useEventResponses } from "@/hooks/useEventResponses";
import { useSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import { format, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function isWeekend(date: Date) {
  const day = getDay(date);
  return day === 5 || day === 6 || day === 0;
}

interface WeekendGroup { friday: Date; sunday: Date; dates: Date[]; label: string; }

function makeGroup(dates: Date[]): WeekendGroup {
  const first = dates[0];
  const last = dates[dates.length - 1];
  const label = `${format(first, "d", { locale: es })}–${format(last, "d MMM", { locale: es })}`;
  return { friday: first, sunday: last, dates, label };
}

function getWeekendGroups(start: Date, end: Date): WeekendGroup[] {
  const allDays = eachDayOfInterval({ start, end });
  const weekendDays = allDays.filter(isWeekend);
  const groups: WeekendGroup[] = [];
  let current: Date[] = [];
  for (const d of weekendDays) {
    if (current.length === 0) { current.push(d); }
    else {
      const last = current[current.length - 1];
      const diff = (d.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1) current.push(d);
      else { groups.push(makeGroup(current)); current = [d]; }
    }
  }
  if (current.length > 0) groups.push(makeGroup(current));
  return groups;
}

export function WeekendRanking() {
  const { data: responses = [] } = useEventResponses();
  const { data: settings } = useSiteSettings();

  const weekendGroups = useMemo(() => {
    const { start, end } = getDateRange(settings);
    return getWeekendGroups(start, end);
  }, [settings]);

  const people = useMemo(
    () => [...new Set(responses.map((r) => r.person_name))].filter((n) => n !== "admin123"),
    [responses]
  );

  const ranked = useMemo(() => {
    if (people.length === 0) return [];
    const unavailableSet = new Set(responses.map((r) => `${r.person_name}|${r.unavailable_date}`));
    return weekendGroups.map((group) => {
      let totalUnavailable = 0;
      for (const date of group.dates) {
        const dateStr = format(date, "yyyy-MM-dd");
        for (const person of people) {
          if (unavailableSet.has(`${person}|${dateStr}`)) totalUnavailable++;
        }
      }
      const maxPossible = people.length * group.dates.length;
      const available = maxPossible - totalUnavailable;
      const pct = maxPossible > 0 ? Math.round((available / maxPossible) * 100) : 0;
      return { ...group, available, maxPossible, pct, totalUnavailable };
    }).sort((a, b) => b.pct - a.pct || a.friday.getTime() - b.friday.getTime());
  }, [responses, people, weekendGroups]);

  if (people.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">Mejores fines de semana</h2>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((item, idx) => {
          const isTop = idx === 0;
          const barColor = item.pct >= 70 ? "bg-emerald-500" : item.pct >= 40 ? "bg-amber-500" : "bg-red-500";
          const textColor = item.pct >= 70 ? "text-emerald-600 dark:text-emerald-400" : item.pct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

          return (
            <div
              key={item.label}
              className={cn(
                "glass rounded-2xl p-4 transition-all animate-fade-up",
                isTop && "ring-2 ring-primary/30 shadow-lg shadow-primary/10",
              )}
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{medals[idx] ?? `#${idx + 1}`}</span>
                    <span className="text-sm font-semibold capitalize">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {people.length - [...new Set(item.dates.flatMap(d => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      return responses.filter(r => r.unavailable_date === dateStr && r.person_name !== "admin123").map(r => r.person_name);
                    }))].length} de {people.length} pueden
                  </p>
                </div>
                <span className={cn("text-xl font-bold font-mono", textColor)}>{item.pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", barColor)}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
