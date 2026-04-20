import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
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

interface NameEntryProps {
  onSubmit: (name: string) => void;
}

export function NameEntry({ onSubmit }: NameEntryProps) {
  const [name, setName] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [checking, setChecking] = useState(false);
  const { data: settings } = useSiteSettings();

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setChecking(true);
    const { data } = await supabase
      .from("event_responses")
      .select("id")
      .eq("person_name", trimmed)
      .limit(1);
    setChecking(false);

    if (data && data.length > 0) {
      setShowDialog(true);
    } else {
      onSubmit(trimmed);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            <span aria-hidden>{settings.emoji}</span>
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold">{settings.title}</h1>
          <p className="mb-6 text-center text-muted-foreground">
            {settings.description}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex gap-3"
          >
            <Input
              placeholder="Tu nombre..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
              autoFocus
            />
            <Button type="submit" disabled={!name.trim() || checking} className="h-12 px-6">
              {checking ? "..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nombre ya registrado</AlertDialogTitle>
            <AlertDialogDescription>
              Ya existen respuestas con el nombre <strong>"{name.trim()}"</strong>. ¿Deseas modificar las respuestas existentes o usar otro nombre?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDialog(false)}>
              Usar otro nombre
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDialog(false); onSubmit(name.trim()); }}>
              Modificar existente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
