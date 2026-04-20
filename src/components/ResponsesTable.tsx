import { useMemo } from "react";
import { useEventResponses } from "@/hooks/useEventResponses";
import { useSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import { format, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    a.href = url;
    a.download = "disponibilidad_evento.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center shadow-sm">
        <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">Aún no hay respuestas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Respuestas ({people.length} {people.length === 1 ? "persona" : "personas"})
        </h2>
        <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/80 px-3 py-2 text-left font-semibold backdrop-blur">Nombre</th>
              {weekendDates.map((d) => (
                <th key={d.toISOString()} className="min-w-[60px] px-2 py-2 text-center font-medium">
                  <div>{format(d, "dd", { locale: es })}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">{format(d, "EEE MMM", { locale: es })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.map((name) => (
              <tr key={name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium backdrop-blur">{name}</td>
                {weekendDates.map((d) => {
                  const dateStr = format(d, "yyyy-MM-dd");
                  const unavailable = unavailableSet.has(`${name}|${dateStr}`);
                  return (
                    <td key={dateStr} className="px-2 py-2 text-center">
                      {unavailable ? (
                        <span className="inline-block h-5 w-5 rounded-full bg-destructive/20 text-destructive">✕</span>
                      ) : (
                        <span className="inline-block h-5 w-5 rounded-full bg-accent/20 text-accent">✓</span>
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
  );
}
