import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface NameEntryProps { onSubmit: (name: string) => void; }

export function NameEntry({ onSubmit }: NameEntryProps) {
  const [name, setName] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [checking, setChecking] = useState(false);
  const { data: settings } = useSiteSettings();

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setChecking(true);
    const { data } = await supabase.from("event_responses").select("id").eq("person_name", trimmed).limit(1);
    setChecking(false);
    if (data && data.length > 0) setShowDialog(true);
    else onSubmit(trimmed);
  };

  return (
    <div className="mesh-bg flex min-h-screen items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo mark */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Calendar className="h-7 w-7 text-white" />
          </div>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="mb-1 text-center">
            <span className="text-4xl">{settings.emoji}</span>
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">{settings.title}</h1>
          <p className="mb-8 text-center text-sm text-muted-foreground leading-relaxed">{settings.description}</p>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3">
            <Input
              placeholder="Tu nombre..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border-border/60 bg-background/60 text-base focus-visible:ring-primary/50"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!name.trim() || checking}
              className="h-12 w-full gap-2 rounded-xl bg-primary font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              {checking ? "Verificando..." : "Entrar"}
              {!checking && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Marca los fines de semana que <strong>no puedes</strong> asistir
        </p>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Nombre ya registrado</AlertDialogTitle>
            <AlertDialogDescription>
              Ya existen respuestas con el nombre <strong>"{name.trim()}"</strong>. ¿Deseas modificarlas o usar otro nombre?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Usar otro nombre</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDialog(false); onSubmit(name.trim()); }}>
              Modificar existente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
