import { PartyPopper, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useUpdateSiteSettings } from "@/hooks/useSiteSettings";

interface ConfirmedBannerProps {
  weekendKey: string; // "yyyy-MM-dd" of the friday
  isAdmin: boolean;
}

export function ConfirmedBanner({ weekendKey, isAdmin }: ConfirmedBannerProps) {
  const update = useUpdateSiteSettings();

  const friday = parseISO(weekendKey);
  const label = format(friday, "d 'al' d+2 'de' MMMM yyyy", { locale: es });
  // Better label: fri to sun
  const fri = format(friday, "d", { locale: es });
  const sun = new Date(friday);
  sun.setDate(sun.getDate() + 2);
  const sunLabel = format(sun, "d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 to-accent/90 p-5 text-white shadow-lg shadow-primary/20 animate-fade-up">
      {/* Background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-2xl">
            <PartyPopper className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/70 uppercase tracking-wider">¡Fecha confirmada!</p>
            <p className="text-lg font-bold">
              {fri} al {sunLabel}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => update.mutate({ confirmed_weekend: null })}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Quitar confirmación"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
