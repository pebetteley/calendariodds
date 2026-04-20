import { useState } from "react";
import { NameEntry } from "@/components/NameEntry";
import { EventCalendar } from "@/components/EventCalendar";
import { ResponsesTable } from "@/components/ResponsesTable";
import { WeekendRanking } from "@/components/WeekendRanking";
import { AdminPanel } from "@/components/AdminPanel";
import { LogOut, Shield, Moon, Sun, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  // Apply on mount
  useState(() => {
    document.documentElement.classList.toggle("dark", dark);
  });

  return { dark, toggle };
}

export default function Index() {
  const [name, setName] = useState<string | null>(() => localStorage.getItem("event_planner_name"));
  const { data: settings } = useSiteSettings();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [copied, setCopied] = useState(false);

  const handleSubmit = (n: string) => {
    localStorage.setItem("event_planner_name", n);
    setName(n);
  };

  const handleLogout = () => {
    localStorage.removeItem("event_planner_name");
    setName(null);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!name) return <NameEntry onSubmit={handleSubmit} />;

  const isAdmin = name === "admin123";
  const displayName = isAdmin ? "Admin" : name;

  const { start, end } = getDateRange(settings);
  const rangeLabel = `${format(start, "MMM", { locale: es })}–${format(end, "MMM yyyy", { locale: es })}`;

  return (
    <div className="mesh-bg min-h-screen">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-60 -right-60 h-[600px] w-[600px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-accent/8 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-base">
              {settings.emoji}
            </div>
            <span className="font-bold tracking-tight">{settings.title}</span>
            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:block">
              {rangeLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share button */}
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-xs">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:block">{copied ? "¡Copiado!" : "Compartir"}</span>
            </Button>

            {/* Dark mode toggle */}
            <Button variant="ghost" size="icon" onClick={toggleDark} className="h-8 w-8">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className="h-4 w-px bg-border" />

            {isAdmin && <Shield className="h-4 w-4 text-primary" />}
            <span className="hidden text-sm text-muted-foreground sm:block">
              <strong className="text-foreground">{displayName}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-10 py-8">
        {/* Hero */}
        <div className="animate-fade-up">
          <p className="text-sm font-medium text-primary mb-1">Encuesta de disponibilidad</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {settings.title}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-lg">{settings.description}</p>
        </div>

        {isAdmin && (
          <div className="animate-fade-up delay-1">
            <AdminPanel />
          </div>
        )}

        <section className="animate-fade-up delay-2">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Calendario</h2>
          <EventCalendar currentUser={name} />
        </section>

        <section className="animate-fade-up delay-3">
          <WeekendRanking />
        </section>

        <section className="animate-fade-up delay-4">
          <ResponsesTable />
        </section>
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        Hecho con ❤️ para los DDS
      </footer>
    </div>
  );
}
