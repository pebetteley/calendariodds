import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Reaction {
  id: string;
  weekend_key: string;
  person_name: string;
  emoji: string;
  comment: string | null;
  created_at: string;
}

export function useReactions() {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel("reactions_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, () =>
        qc.invalidateQueries({ queryKey: ["reactions"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery<Reaction[]>({
    queryKey: ["reactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reactions").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ weekendKey, personName, emoji, comment }: { weekendKey: string; personName: string; emoji: string; comment?: string }) => {
      const { error } = await supabase.from("reactions").upsert(
        { weekend_key: weekendKey, person_name: personName, emoji, comment: comment ?? null },
        { onConflict: "weekend_key,person_name" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reactions"] }),
  });
}

export function useDeleteReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ weekendKey, personName }: { weekendKey: string; personName: string }) => {
      const { error } = await supabase.from("reactions").delete()
        .eq("weekend_key", weekendKey).eq("person_name", personName);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reactions"] }),
  });
}
