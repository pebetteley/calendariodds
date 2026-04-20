import { useState } from "react";
import { NameEntry } from "@/components/NameEntry";
import { EventCalendar } from "@/components/EventCalendar";
import { ResponsesTable } from "@/components/ResponsesTable";
import { WeekendRanking } from "@/components/WeekendRanking";
import { AdminPanel } from "@/components/AdminPanel";
import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Index() {
  const [name, setName] = useState<string | null>(() => {
    return localStorage.getItem("event_planner_name");
  });
  const { data: settings } = useSiteSettings();

  const handleSubmit = (n: string) => {
    localStorage.setItem("event_planner_name", n);
    setName(n);
  };

  const handleLogout = () => {
    localStorage.removeItem("event_planner_name");
    setName(null);
  };

  if (!name) return <NameEntry onSubmit={handleSubmit} />;

  const isAdmin = name === "admin123";
  const displayName = isAdmin ? "Admin" : name;

  const { start, end } = getDateRange(settings);
  const rangeLabel = `${format(start, "MMM yyyy", { locale: es })}–${format(end, "MMM yyyy", { locale: es })}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none" aria-hidden>{settings.emoji}</span>
            <span className="font-semibold">{settings.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && <Shield className="h-4 w-4 text-primary" />}
            <span className="text-sm text-muted-foreground">
              Hola, <strong className="text-foreground">{displayName}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container animate-fade-in space-y-8 py-8">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
            <span aria-hidden>{settings.emoji}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold capitalize">Disponibilidad {rangeLabel}</h1>
            <p className="text-muted-foreground">{settings.description}</p>
          </div>
        </div>

        {isAdmin && <AdminPanel />}

        <EventCalendar currentUser={name} />

        <WeekendRanking />

        <ResponsesTable />
      </main>
    </div>
  );
}
