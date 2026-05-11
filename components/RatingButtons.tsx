"use client";
import { Rating } from "@/lib/types";

const OPTIONS: { value: Rating; emoji: string; label: string; color: string }[] = [
  { value: "great",    emoji: "😍", label: "Çok Güzel", color: "bg-green-400" },
  { value: "good",     emoji: "🙂", label: "Güzel",     color: "bg-lime-400"  },
  { value: "ok",       emoji: "😐", label: "Normal",    color: "bg-yellow-300" },
  { value: "bad",      emoji: "🙁", label: "Kötü",      color: "bg-orange-400" },
  { value: "terrible", emoji: "😢", label: "Çok Kötü",  color: "bg-rose-400"   }
];

export const RATING_EMOJI: Record<Rating, string> = {
  great: "😍", good: "🙂", ok: "😐", bad: "🙁", terrible: "😢"
};

export function RatingButtons({
  current,
  onPick,
  size = "md"
}: {
  current?: Rating;
  onPick: (r: Rating) => void;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "text-2xl py-1 px-2" : "text-3xl py-2 px-3";
  return (
    <div className="flex gap-1 justify-between">
      {OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            onClick={(e) => {
              e.stopPropagation();
              onPick(o.value);
            }}
            title={o.label}
            className={`${o.color} ${cls} rounded-2xl flex-1 transition shadow ${
              active ? "ring-4 ring-slate-800 scale-110" : "opacity-80 hover:opacity-100"
            }`}
          >
            {o.emoji}
          </button>
        );
      })}
    </div>
  );
}
