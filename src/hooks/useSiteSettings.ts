import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface SiteSettings {
  title: string;
  description: string;
  emoji: string;
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  confirmed_weekend: string | null;
}

const DEFAULTS: SiteSettings = {
  title: "DDS Chorlitos",
  description: "Marca los fines de semana (viernes a domingo) que no puedes asistir. El número indica cuántos no pueden ese día.",
  emoji: "📅",
  start_year: 2026,
  start_month: 6,
  end_year: 2026,
  end_month: 11,
  confirmed_weekend: null,
};

export function useSiteSettings() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`site_settings_realtime_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () =>
        qc.invalidateQueries({ queryKey: ["site-settings"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("title, description, emoji, start_year, start_month, end_year, end_month, confirmed_weekend")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return (data as SiteSettings) ?? DEFAULTS;
    },
    initialData: DEFAULTS,
  });
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<SiteSettings>) => {
      const { error } = await supabase.from("site_settings").update(patch).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-settings"] }),
  });
}

export function getDateRange(s: SiteSettings): { start: Date; end: Date } {
  const start = new Date(s.start_year, s.start_month - 1, 1);
  const end = new Date(s.end_year, s.end_month, 0);
  return { start, end };
}
