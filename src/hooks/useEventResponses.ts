import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EventResponse } from "@/lib/supabase";

export function useEventResponses() {
  return useQuery<EventResponse[]>({
    queryKey: ["event-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_responses")
        .select("*")
        .order("person_name")
        .order("unavailable_date");
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, date, isUnavailable }: { name: string; date: string; isUnavailable: boolean }) => {
      if (isUnavailable) {
        const { error } = await supabase
          .from("event_responses")
          .delete()
          .eq("person_name", name)
          .eq("unavailable_date", date);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_responses")
          .insert({ person_name: name, unavailable_date: date });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-responses"] }),
  });
}

export function useToggleWeekendBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, dates, isUnavailable }: { name: string; dates: string[]; isUnavailable: boolean }) => {
      if (isUnavailable) {
        // Remove all dates in the block in a single query
        const { error } = await supabase
          .from("event_responses")
          .delete()
          .eq("person_name", name)
          .in("unavailable_date", dates);
        if (error) throw error;
      } else {
        // Insert all dates in the block
        const rows = dates.map((d) => ({ person_name: name, unavailable_date: d }));
        const { error } = await supabase
          .from("event_responses")
          .insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-responses"] }),
  });
}

export function useDeleteUserResponses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (personName: string) => {
      const { error } = await supabase
        .from("event_responses")
        .delete()
        .eq("person_name", personName);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-responses"] }),
  });
}
