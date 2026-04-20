import { useMemo } from "react";
import { useEventResponses } from "@/hooks/useEventResponses";
import { useExpectedAttendees } from "@/hooks/useExpectedAttendees";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ParticipationProgress() {
  const { data: responses = [] } = useEventResponses();
  const { data: expected = [] } = useExpectedAttendees();

  const responded = useMemo(
    () => [...new Set(responses.map((r) => r.person_name))].filter((n) => n !== "admin123"),
    [responses]
  );

  // If no expected list defined, just show who responded
  if (expected.length === 0) {
    if (responded.length === 0) return null;
    return (
      <div className="glass rounded-2xl p-4 flex items-center gap-4 animate-fade-up">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{responded.length} {responded.length === 1 ? "persona respondió" : "personas respondieron"}</p>
          <p className="text-xs text-muted-foreground">{responded.slice(0, 4).join(", ")}{responded.length > 4 ? ` y ${responded.length - 4} más` : ""}</p>
        </div>
      </div>
    );
  }

  const pending = expected.filter((n) => !responded.includes(n));
  const pct = Math.round((responded.length / expected.length) * 100);
  const done = pct === 100;

  return (
    <div className={cn("glass rounded-2xl p-4 animate-fade-up", done && "ring-2 ring-emerald-500/30")}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {done
            ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            : <Clock className="h-5 w-5 text-amber-500" />
          }
          <span className="font-semibold text-sm">
            {done ? "¡Todos respondieron!" : `${responded.length} de ${expected.length} respondieron`}
          </span>
        </div>
        <span className={cn("text-sm font-bold font-mono", done ? "text-emerald-500" : "text-amber-500")}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted mb-3">
        <div
          className={cn("h-full rounded-full transition-all duration-700", done ? "bg-emerald-500" : "bg-amber-500")}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Avatars */}
      <div className="flex flex-wrap gap-1.5">
        {expected.map((name) => {
          const hasResponded = responded.includes(name);
          return (
            <div
              key={name}
              title={hasResponded ? `${name} ✓` : `${name} — pendiente`}
              className={cn(
                "flex h-7 items-center rounded-full px-2.5 text-xs font-medium transition-all",
                hasResponded
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground border border-border/50 opacity-60"
              )}
            >
              {hasResponded && <CheckCircle2 className="mr-1 h-3 w-3" />}
              {name}
            </div>
          );
        })}
      </div>

      {pending.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Faltan: <span className="text-amber-600 dark:text-amber-400 font-medium">{pending.join(", ")}</span>
        </p>
      )}
    </div>
  );
}
