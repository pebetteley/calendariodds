import { useMemo, useState, useEffect } from "react";
import { useEventResponses, useDeleteUserResponses, useToggleDate } from "@/hooks/useEventResponses";
import { useSiteSettings, useUpdateSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import { format, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, Trash2, UserX, CalendarPlus, CalendarMinus, Save, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

function isWeekend(date: Date) {
  const day = getDay(date);
  return day === 5 || day === 6 || day === 0;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const QUICK_EMOJIS = ["📅", "🎉", "🎂", "🍻", "⛺", "🏖️", "🎵", "⚽", "🎮", "🍕", "✈️", "🏠", "🎯", "🌟", "🔥", "💃"];

export function AdminPanel() {
  const { data: responses = [] } = useEventResponses();
  const { data: settings } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const deleteUser = useDeleteUserResponses();
  const toggleDate = useToggleDate();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Site settings local state
  const [title, setTitle] = useState(settings.title);
  const [description, setDescription] = useState(settings.description);
  const [emoji, setEmoji] = useState(settings.emoji);
  const [startYear, setStartYear] = useState(settings.start_year);
  const [startMonth, setStartMonth] = useState(settings.start_month);
  const [endYear, setEndYear] = useState(settings.end_year);
  const [endMonth, setEndMonth] = useState(settings.end_month);

  useEffect(() => {
    setTitle(settings.title);
    setDescription(settings.description);
    setEmoji(settings.emoji);
    setStartYear(settings.start_year);
    setStartMonth(settings.start_month);
    setEndYear(settings.end_year);
    setEndMonth(settings.end_month);
  }, [settings]);

  const weekendDates = useMemo(() => {
    const { start, end } = getDateRange(settings);
    return eachDayOfInterval({ start, end }).filter(isWeekend);
  }, [settings]);

  const people = useMemo(
    () => [...new Set(responses.map((r) => r.person_name))].sort(),
    [responses]
  );

  const unavailableSet = useMemo(
    () => new Set(responses.map((r) => `${r.person_name}|${r.unavailable_date}`)),
    [responses]
  );

  const handleDelete = (name: string) => {
    deleteUser.mutate(name, {
      onSuccess: () => {
        toast.success(`Respuestas de "${name}" eliminadas`);
        setConfirmDelete(null);
      },
    });
  };

  const handleToggleDate = () => {
    if (!selectedUser || !selectedDate) return;
    const isUnavailable = unavailableSet.has(`${selectedUser}|${selectedDate}`);
    toggleDate.mutate(
      { name: selectedUser, date: selectedDate, isUnavailable },
      {
        onSuccess: () => {
          toast.success(
            isUnavailable
              ? `Se desbloqueó ${selectedDate} para ${selectedUser}`
              : `Se bloqueó ${selectedDate} para ${selectedUser}`
          );
        },
      }
    );
  };

  const handleSaveSettings = () => {
    // Validate range
    const startKey = startYear * 12 + startMonth;
    const endKey = endYear * 12 + endMonth;
    if (endKey < startKey) {
      toast.error("El mes final debe ser igual o posterior al mes inicial");
      return;
    }
    if (!title.trim()) {
      toast.error("El título no puede estar vacío");
      return;
    }
    updateSettings.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        emoji: emoji || "📅",
        start_year: startYear,
        start_month: startMonth,
        end_year: endYear,
        end_month: endMonth,
      },
      {
        onSuccess: () => toast.success("Configuración guardada"),
        onError: (e: any) => toast.error(e.message ?? "Error al guardar"),
      }
    );
  };

  const isDateUnavailable = selectedUser && selectedDate
    ? unavailableSet.has(`${selectedUser}|${selectedDate}`)
    : false;

  // Year options: current year ± 5
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Panel de Administrador</h2>
      </div>

      {/* Site settings */}
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Configuración del sitio</h3>

        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="space-y-2">
            <Label htmlFor="emoji" className="text-xs">Emoji / Ícono</Label>
            <Input
              id="emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              className="h-16 w-20 text-center text-3xl"
            />
            <div className="flex flex-wrap gap-1 max-w-[180px]">
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted text-base"
                  aria-label={`Usar ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Smile className="h-3 w-3" /> O usa el teclado de emojis
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nombre del evento"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs">Descripción del landing</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Instrucciones para los participantes"
              />
            </div>
          </div>
        </div>

        {/* Date range */}
        <div className="space-y-2">
          <Label className="text-xs">Rango de meses de la encuesta</Label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Desde</span>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(Number(e.target.value))}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-xs text-muted-foreground">hasta</span>
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(Number(e.target.value))}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={updateSettings.isPending}
          size="sm"
          className="gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          {updateSettings.isPending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>

      {/* Delete users section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Eliminar respuestas de usuario</h3>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {people.map((name) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDelete(name)}
              >
                <UserX className="h-3.5 w-3.5" />
                {name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Toggle dates section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Bloquear / Desbloquear fecha para un usuario</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Usuario</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Seleccionar...</option>
              {people.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fecha (fin de semana)</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Seleccionar...</option>
              {weekendDates.map((d) => {
                const dateStr = format(d, "yyyy-MM-dd");
                return (
                  <option key={dateStr} value={dateStr}>
                    {format(d, "EEE d MMM yyyy", { locale: es })}
                  </option>
                );
              })}
            </select>
          </div>
          <Button
            size="sm"
            disabled={!selectedUser || !selectedDate || toggleDate.isPending}
            onClick={handleToggleDate}
            variant={isDateUnavailable ? "default" : "destructive"}
            className="gap-1.5"
          >
            {isDateUnavailable ? (
              <><CalendarPlus className="h-3.5 w-3.5" /> Desbloquear</>
            ) : (
              <><CalendarMinus className="h-3.5 w-3.5" /> Bloquear</>
            )}
          </Button>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar respuestas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará todas las respuestas de <strong>"{confirmDelete}"</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
