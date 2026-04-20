import { useMemo, useState, useEffect } from "react";
import { useEventResponses, useDeleteUserResponses, useToggleDate } from "@/hooks/useEventResponses";
import { useReactions, useDeleteReaction } from "@/hooks/useReactions";
import { useSiteSettings, useUpdateSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import { useExpectedAttendees, useAddExpectedAttendee, useRemoveExpectedAttendee } from "@/hooks/useExpectedAttendees";
import { format, eachDayOfInterval, getDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Shield, Trash2, UserX, CalendarPlus, CalendarMinus,
  Save, Smile, PartyPopper, Users, X, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function isWeekend(date: Date) { return [5, 6, 0].includes(getDay(date)); }

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const QUICK_EMOJIS = ["📅","🎉","🎂","🍻","⛺","🏖️","🎵","⚽","🎮","🍕","✈️","🏠","🎯","🌟","🔥","💃"];

function getFridays(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end }).filter((d) => getDay(d) === 5);
}

export function AdminPanel() {
  const { data: responses = [] } = useEventResponses();
  const { data: settings } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const deleteUser = useDeleteUserResponses();
  const toggleDate = useToggleDate();
  const { data: reactions = [] } = useReactions();
  const deleteReaction = useDeleteReaction();
  const { data: expectedAttendees = [] } = useExpectedAttendees();
  const addAttendee = useAddExpectedAttendee();
  const removeAttendee = useRemoveExpectedAttendee();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [newAttendeeName, setNewAttendeeName] = useState("");

  const [title, setTitle] = useState(settings.title);
  const [description, setDescription] = useState(settings.description);
  const [emoji, setEmoji] = useState(settings.emoji);
  const [startYear, setStartYear] = useState(settings.start_year);
  const [startMonth, setStartMonth] = useState(settings.start_month);
  const [endYear, setEndYear] = useState(settings.end_year);
  const [endMonth, setEndMonth] = useState(settings.end_month);

  useEffect(() => {
    setTitle(settings.title); setDescription(settings.description); setEmoji(settings.emoji);
    setStartYear(settings.start_year); setStartMonth(settings.start_month);
    setEndYear(settings.end_year); setEndMonth(settings.end_month);
  }, [settings]);

  const weekendDates = useMemo(() => {
    const { start, end } = getDateRange(settings);
    return eachDayOfInterval({ start, end }).filter(isWeekend);
  }, [settings]);

  const fridays = useMemo(() => {
    const { start, end } = getDateRange(settings);
    return getFridays(start, end);
  }, [settings]);

  const people = useMemo(() => {
    const fromResponses = responses.map((r) => r.person_name);
    const fromReactions = reactions.map((r) => r.person_name);
    return [...new Set([...fromResponses, ...fromReactions])].filter((n) => n !== "admin123").sort();
  }, [responses, reactions]);
  const unavailableSet = useMemo(() => new Set(responses.map((r) => `${r.person_name}|${r.unavailable_date}`)), [responses]);

  const isDateUnavailable = selectedUser && selectedDate ? unavailableSet.has(`${selectedUser}|${selectedDate}`) : false;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);

  const handleDeleteUser = (name: string) => {
    deleteUser.mutate(name);
    // Also delete all reactions from this user
    reactions.filter((r) => r.person_name === name).forEach((r) => {
      deleteReaction.mutate({ weekendKey: r.weekend_key, personName: name });
    });
    toast.success(`Respuestas de "${name}" eliminadas`);
    setConfirmDelete(null);
  };

  const handleSaveSettings = () => {
    const startKey = startYear * 12 + startMonth;
    const endKey = endYear * 12 + endMonth;
    if (endKey < startKey) { toast.error("El mes final debe ser igual o posterior al inicial"); return; }
    if (!title.trim()) { toast.error("El título no puede estar vacío"); return; }
    updateSettings.mutate(
      { title: title.trim(), description: description.trim(), emoji: emoji || "📅", start_year: startYear, start_month: startMonth, end_year: endYear, end_month: endMonth },
      { onSuccess: () => toast.success("Configuración guardada"), onError: (e: any) => toast.error(e.message ?? "Error") }
    );
  };

  const handleConfirmWeekend = (fridayStr: string) => {
    updateSettings.mutate(
      { confirmed_weekend: fridayStr },
      { onSuccess: () => toast.success("¡Fin de semana confirmado! 🎉") }
    );
  };

  const handleAddAttendee = () => {
    const trimmed = newAttendeeName.trim();
    if (!trimmed) return;
    addAttendee.mutate(trimmed, {
      onSuccess: () => { toast.success(`${trimmed} agregado`); setNewAttendeeName(""); },
      onError: () => toast.error("Error al agregar"),
    });
  };

  const sectionClass = "space-y-3 rounded-xl border border-border/50 bg-card/50 p-4";

  return (
    <div className="space-y-4 rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-bold tracking-tight">Panel de Administrador</h2>
      </div>

      {/* Site settings */}
      <div className={sectionClass}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configuración del sitio</h3>
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="space-y-2">
            <Label className="text-xs">Emoji</Label>
            <Input id="emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="h-14 w-16 text-center text-3xl" />
            <div className="flex flex-wrap gap-1 max-w-[180px]">
              {QUICK_EMOJIS.map((em) => (
                <button key={em} type="button" onClick={() => setEmoji(em)} className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted text-base">{em}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del evento" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Instrucciones..." />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Rango de meses</Label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Desde</span>
            <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))} className="h-9 rounded-lg border bg-background px-2 text-sm">
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} className="h-9 rounded-lg border bg-background px-2 text-sm">
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-xs text-muted-foreground">hasta</span>
            <select value={endMonth} onChange={(e) => setEndMonth(Number(e.target.value))} className="h-9 rounded-lg border bg-background px-2 text-sm">
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={endYear} onChange={(e) => setEndYear(Number(e.target.value))} className="h-9 rounded-lg border bg-background px-2 text-sm">
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <Button onClick={handleSaveSettings} disabled={updateSettings.isPending} size="sm" className="gap-1.5 rounded-xl">
          <Save className="h-3.5 w-3.5" />
          {updateSettings.isPending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>

      {/* Confirm weekend */}
      <div className={sectionClass}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmar fin de semana</h3>
        <p className="text-xs text-muted-foreground">Elige el fin de semana definitivo — aparecerá como banner para todos.</p>
        {settings.confirmed_weekend && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            <PartyPopper className="h-4 w-4" />
            Confirmado: {format(new Date(settings.confirmed_weekend + "T12:00:00"), "d 'de' MMMM yyyy", { locale: es })}
            <button onClick={() => updateSettings.mutate({ confirmed_weekend: null })} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {fridays.map((friday) => {
            const fridayStr = format(friday, "yyyy-MM-dd");
            const sun = addDays(friday, 2);
            const label = `${format(friday, "d")}–${format(sun, "d MMM", { locale: es })}`;
            const isConfirmed = settings.confirmed_weekend === fridayStr;
            return (
              <button
                key={fridayStr}
                onClick={() => handleConfirmWeekend(fridayStr)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:scale-105",
                  isConfirmed
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-muted text-muted-foreground hover:bg-muted/60"
                )}
              >
                {label} {isConfirmed && "✓"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expected attendees */}
      <div className={sectionClass}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grupo esperado</h3>
        <p className="text-xs text-muted-foreground">Define quiénes son del grupo para mostrar el progreso de respuestas.</p>
        <div className="flex gap-2">
          <Input
            value={newAttendeeName}
            onChange={(e) => setNewAttendeeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddAttendee()}
            placeholder="Nombre del integrante..."
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={handleAddAttendee} disabled={!newAttendeeName.trim()} className="gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Agregar
          </Button>
        </div>
        {expectedAttendees.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {expectedAttendees.map((name) => (
              <div key={name} className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
                {name}
                <button onClick={() => removeAttendee.mutate(name)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete users */}
      <div className={sectionClass}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eliminar respuestas de usuario</h3>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {people.map((name) => (
              <Button key={name} variant="outline" size="sm" className="gap-1.5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(name)}>
                <UserX className="h-3.5 w-3.5" /> {name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Toggle dates */}
      <div className={sectionClass}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bloquear / desbloquear fecha</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Usuario</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">Seleccionar...</option>
              {people.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fecha</label>
            <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">Seleccionar...</option>
              {weekendDates.map((d) => {
                const dateStr = format(d, "yyyy-MM-dd");
                return <option key={dateStr} value={dateStr}>{format(d, "EEE d MMM yyyy", { locale: es })}</option>;
              })}
            </select>
          </div>
          <Button
            size="sm" disabled={!selectedUser || !selectedDate || toggleDate.isPending}
            onClick={() => {
              if (!selectedUser || !selectedDate) return;
              const isUnavailable = unavailableSet.has(`${selectedUser}|${selectedDate}`);
              toggleDate.mutate({ name: selectedUser, date: selectedDate, isUnavailable }, {
                onSuccess: () => toast.success(isUnavailable ? `Desbloqueado ${selectedDate} para ${selectedUser}` : `Bloqueado ${selectedDate} para ${selectedUser}`)
              });
            }}
            variant={isDateUnavailable ? "default" : "destructive"}
            className="gap-1.5 rounded-xl"
          >
            {isDateUnavailable ? <><CalendarPlus className="h-3.5 w-3.5" /> Desbloquear</> : <><CalendarMinus className="h-3.5 w-3.5" /> Bloquear</>}
          </Button>
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar respuestas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará todas las respuestas de <strong>"{confirmDelete}"</strong>. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && handleDeleteUser(confirmDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
