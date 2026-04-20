import { useMemo } from "react";
import { useEventResponses } from "@/hooks/useEventResponses";
import { useSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import { format, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isWeekend(date: Date) {
  const day = getDay(date);
  return day === 5 || day === 6 || day === 0;
}

export function ResponsesTable() {
  const { data: responses = [] } = useEventResponses();
  const { data: settings } = useSiteSettings();

  const weekendDates = useMemo(() => {
    const { start, end } = getDateRange(settings);
    return eachDayOfInterval({ start, end }).filter(isWeekend);
  }, [settings]);

  const people = useMemo(
    () => [...new Set(responses.map((r) => r.person_name))].filter((n) => n !== "admin123").sort(),
    [responses]
  );

  const unavailableSet = useMemo(
    () => new Set(responses.map((r) => `${r.person_name}|${r.unavailable_date}`)),
    [responses]
  );

  const exportToCSV = () => {
    const header = ["Nombre", ...weekendDates.map((d) => format(d, "dd/MM/yyyy"))];
    const rows = people.map((name) => [
      name,
      ...weekendDates.map((d) => (unavailableSet.has(`${name}|${format(d, "yyyy-MM-dd")}`) ? "NO PUEDE" : "DISPONIBLE")),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "disponibilidad.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (people.length === 0) {
    return (
      <div className="glass flex flex-col items-center justify-center rounded-2xl p-16 text-center">
        <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">Aún no hay respuestas</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Comparte el link para que otros puedan marcar su disponibilidad</p>
      </div>
    );
  }

  // Group dates by weekend block for column headers
  const dayNames: Record<number, string> = { 5: "Vi", 6: "Sá", 0: "Do" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Respuestas</h2>
          <p className="text-sm text-muted-foreground">{people.length} {people.length === 1 ? "persona" : "personas"} respondieron</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2 rounded-xl">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="sticky left-0 z-10 bg-muted/60 backdrop-blur px-4 py-3 text-left font-semibold text-foreground/70 min-w-[120px]">
                  Nombre
                </th>
                {weekendDates.map((d) => (
                  <th key={d.toISOString()} className="min-w-[44px] px-2 py-3 text-center font-medium text-muted-foreground">
                    <div className="font-semibold text-foreground/60">{format(d, "dd", { locale: es })}</div>
                    <div className="text-[10px] uppercase tracking-wide">{dayNames[getDay(d)]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {people.map((name, idx) => (
                <tr
                  key={name}
                  className={cn("border-b border-border/30 last:border-0 transition-colors hover:bg-muted/20", idx % 2 === 0 && "bg-muted/5")}
                >
                  <td className="sticky left-0 z-10 bg-card/80 backdrop-blur px-4 py-2.5 font-medium">{name}</td>
                  {weekendDates.map((d) => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    const unavailable = unavailableSet.has(`${name}|${dateStr}`);
                    return (
                      <td key={dateStr} className="px-2 py-2.5 text-center">
                        {unavailable ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15 text-destructive text-[11px] font-bold">✕</span>
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">✓</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
