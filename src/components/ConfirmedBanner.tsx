import { PartyPopper, X, CalendarCheck, ArrowDown } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useUpdateSiteSettings } from "@/hooks/useSiteSettings";

interface ConfirmedBannerProps {
  weekendKey: string;
  isAdmin: boolean;
  currentUser: string;
}

export function ConfirmedBanner({ weekendKey, isAdmin, currentUser }: ConfirmedBannerProps) {
  const update = useUpdateSiteSettings();

  const friday = parseISO(weekendKey + "T12:00:00");
  const sun = addDays(friday, 2);
  const friLabel = format(friday, "d", { locale: es });
  const sunLabel = format(sun, "d 'de' MMMM yyyy", { locale: es });
  const monthLabel = format(friday, "MMMM", { locale: es });

  return (
    <div className="space-y-3 animate-fade-up">
      {/* Main confirmed banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent p-5 text-white shadow-lg shadow-primary/25">
        {/* Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-[shimmer_3s_ease-in-out_infinite]" />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl shrink-0">
              🎉
            </div>
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-0.5">
                ¡Fecha confirmada!
              </p>
              <p className="text-xl font-bold leading-tight">
                {friLabel} al {sunLabel}
              </p>
              <p className="text-sm text-white/80 mt-0.5 capitalize">{monthLabel} — viernes a domingo</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => update.mutate({ confirmed_weekend: null })}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Quitar confirmación"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* User nudge — only for non-admins */}
      {!isAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <CalendarCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Revisa tu disponibilidad para este fin de semana
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hola <strong>{currentUser}</strong> — puedes seguir editando tus preferencias en el calendario de abajo.
              Si el fin de semana está <span className="text-emerald-600 font-medium">verde</span>, puedes ir. Si está <span className="text-destructive font-medium">rojo</span>, lo marcaste como no disponible.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
