import { useMemo } from "react";
import { useEventResponses } from "@/hooks/useEventResponses";
import { useSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import { format, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Trophy, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

function isWeekend(date: Date) {
  const day = getDay(date);
  return day === 5 || day === 6 || day === 0;
}

interface WeekendGroup {
  friday: Date;
  sunday: Date;
  dates: Date[];
  label: string;
}

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
    if (current.length === 0) {
      current.push(d);
    } else {
      const last = current[current.length - 1];
      const diff = (d.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1) current.push(d);
      else {
        groups.push(makeGroup(current));
        current = [d];
      }
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
    () => [...new Set(responses.map((r) => r.person_name))],
    [responses]
  );

  const ranked = useMemo(() => {
    if (people.length === 0) return [];
    const unavailableSet = new Set(
      responses.map((r) => `${r.person_name}|${r.unavailable_date}`)
    );
    return weekendGroups
      .map((group) => {
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
      })
      .sort((a, b) => b.pct - a.pct || a.friday.getTime() - b.friday.getTime());
  }, [responses, people, weekendGroups]);

  if (people.length === 0) return null;

  const topPct = ranked[0]?.pct ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Ranking de Mejores Fines de Semana</h2>
      </div>
      <div className="grid gap-2">
        {ranked.map((item, idx) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 transition-all",
              item.pct === topPct && "border-primary/40 bg-primary/5 shadow-sm",
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {idx === 0 ? (
                <Crown className="h-4 w-4 text-primary" />
              ) : idx === 1 ? (
                <Medal className="h-4 w-4 text-muted-foreground" />
              ) : (
                <span className="text-muted-foreground">{idx + 1}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium capitalize">{item.label}</span>
                <span className={cn(
                  "shrink-0 text-sm font-bold",
                  item.pct >= 80 ? "text-accent" : item.pct >= 50 ? "text-primary" : "text-destructive"
                )}>
                  {item.pct}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    item.pct >= 80 ? "bg-accent" : item.pct >= 50 ? "bg-primary" : "bg-destructive/60"
                  )}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {item.available}/{item.maxPossible} disponibilidades
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
