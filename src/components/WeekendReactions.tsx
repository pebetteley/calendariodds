import { useState } from "react";
import { useReactions, useUpsertReaction, useDeleteReaction } from "@/hooks/useReactions";
import { useSiteSettings, getDateRange } from "@/hooks/useSiteSettings";
import { format, eachDayOfInterval, getDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Smile, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const REACTION_EMOJIS = ["🔥", "❤️", "🎉", "😍", "👍", "😅", "🤔", "❌"];

function isWeekend(date: Date) {
  return [5, 6, 0].includes(getDay(date));
}

function getFridays(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end }).filter((d) => getDay(d) === 5);
}

interface WeekendReactionsProps { currentUser: string; }

export function WeekendReactions({ currentUser }: WeekendReactionsProps) {
  const { data: reactions = [] } = useReactions();
  const { data: settings } = useSiteSettings();
  const upsert = useUpsertReaction();
  const del = useDeleteReaction();
  const [activeWeekend, setActiveWeekend] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const fridays = useMemo(() => {
    const { start, end } = getDateRange(settings);
    return getFridays(start, end);
  }, [settings]);

  const reactionsByWeekend = useMemo(() => {
    const map = new Map<string, typeof reactions>();
    for (const r of reactions) {
      if (!map.has(r.weekend_key)) map.set(r.weekend_key, []);
      map.get(r.weekend_key)!.push(r);
    }
    return map;
  }, [reactions]);

  const handleReact = (weekendKey: string, emoji: string) => {
    const myReaction = reactionsByWeekend.get(weekendKey)?.find((r) => r.person_name === currentUser);
    if (myReaction?.emoji === emoji) {
      del.mutate({ weekendKey, personName: currentUser });
    } else {
      upsert.mutate({ weekendKey, personName: currentUser, emoji, comment: myReaction?.comment ?? undefined });
    }
  };

  const handleComment = (weekendKey: string) => {
    if (!comment.trim()) return;
    const myReaction = reactionsByWeekend.get(weekendKey)?.find((r) => r.person_name === currentUser);
    upsert.mutate({ weekendKey, personName: currentUser, emoji: myReaction?.emoji ?? "💬", comment: comment.trim() });
    setComment("");
    setActiveWeekend(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Smile className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">Reacciones</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fridays.map((friday, idx) => {
          const weekendKey = format(friday, "yyyy-MM-dd");
          const sun = addDays(friday, 2);
          const label = `${format(friday, "d")}–${format(sun, "d MMM", { locale: es })}`;
          const weekendReactions = reactionsByWeekend.get(weekendKey) ?? [];
          const myReaction = weekendReactions.find((r) => r.person_name === currentUser);

          // Count by emoji
          const emojiCounts = weekendReactions.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const isExpanded = activeWeekend === weekendKey;

          return (
            <div
              key={weekendKey}
              className="glass rounded-2xl p-4 space-y-3 animate-fade-up"
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold capitalize">{label}</span>
                {myReaction && (
                  <span className="text-lg">{myReaction.emoji}</span>
                )}
              </div>

              {/* Emoji picker */}
              <div className="flex flex-wrap gap-1">
                {REACTION_EMOJIS.map((emoji) => {
                  const count = emojiCounts[emoji] ?? 0;
                  const isMine = myReaction?.emoji === emoji;
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReact(weekendKey, emoji)}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-1 text-sm transition-all hover:scale-110 active:scale-95",
                        isMine
                          ? "bg-primary/15 ring-2 ring-primary/40 font-semibold"
                          : "bg-muted hover:bg-muted/80",
                        count > 0 ? "opacity-100" : "opacity-50 hover:opacity-100"
                      )}
                    >
                      {emoji}
                      {count > 0 && <span className="text-xs font-bold text-muted-foreground">{count}</span>}
                    </button>
                  );
                })}
                <button
                  onClick={() => setActiveWeekend(isExpanded ? null : weekendKey)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all hover:scale-110",
                    isExpanded ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <MessageCircle className="h-3 w-3" />
                </button>
              </div>

              {/* Comments */}
              {weekendReactions.filter((r) => r.comment).map((r) => (
                <div key={r.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/70">{r.person_name}:</span>
                  <span>{r.comment}</span>
                  <span>{r.emoji}</span>
                </div>
              ))}

              {/* Comment input */}
              {isExpanded && (
                <div className="flex gap-2 animate-scale-in">
                  <input
                    className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Escribe un comentario..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment(weekendKey)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleComment(weekendKey)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white font-medium hover:bg-primary/90 transition-colors"
                  >
                    Enviar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
