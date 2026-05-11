"use client";
import { useRef, useState } from "react";

const AVATARS = [
  "🦁","🐯","🦊","🐻","🐼","🐨","🦄","🐸",
  "🐱","🐰","🐧","🦉","🦒","🦋","🐙","🦈",
  "🦅","🦜","🐬","🐳","🦕","🐉","🌈","⭐",
  "🚀","🎠","🍀","🎈"
];

type Props = { onJoin: (name: string, avatar: string) => void };

export function StudentLoginGrid({ onJoin }: Props) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canJoin = avatar !== null && name.trim().length > 0;

  /* Adım 1 — emoji seç */
  if (!avatar) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-4xl md:text-5xl font-bold text-rose-500 text-center">
          Avatarını seç! 🎨
        </h1>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3 w-full max-w-3xl">
          {AVATARS.map((em) => (
            <button
              key={em}
              onClick={() => {
                setAvatar(em);
                setTimeout(() => inputRef.current?.focus(), 80);
              }}
              className="aspect-square rounded-3xl bg-white shadow-lg text-5xl md:text-6xl flex items-center justify-center hover:bg-sky-100 active:scale-90 transition"
            >
              {em}
            </button>
          ))}
        </div>
      </main>
    );
  }

  /* Adım 2 — isim yaz */
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-[120px] leading-none select-none">{avatar}</div>

      <div className="w-full max-w-xs flex flex-col gap-4">
        <label className="text-2xl font-bold text-slate-600 text-center">
          İsmini yaz:
        </label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canJoin && onJoin(name.trim(), avatar)}
          placeholder="Adın ne?"
          maxLength={30}
          autoComplete="off"
          className="text-3xl font-bold text-center border-4 border-slate-200 focus:border-sky-400 rounded-2xl px-4 py-4 outline-none w-full bg-white shadow"
        />

        <button
          onClick={() => canJoin && onJoin(name.trim(), avatar)}
          disabled={!canJoin}
          className={`py-5 rounded-3xl text-2xl font-bold text-white transition shadow-lg ${
            canJoin
              ? "bg-green-500 hover:bg-green-600 active:scale-95"
              : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          Giriş Yap ✅
        </button>

        <button
          onClick={() => { setAvatar(null); setName(""); }}
          className="text-slate-500 text-lg underline mt-2"
        >
          ← Avatarı değiştir
        </button>
      </div>
    </main>
  );
}
