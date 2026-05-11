"use client";
import { useEffect, useState } from "react";

const TEACHER_PIN = process.env.NEXT_PUBLIC_TEACHER_PIN || "1234";
const STORAGE_KEY = "teacher-authed";

export function TeacherGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [entry, setEntry] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    try {
      setAuthed(sessionStorage.getItem(STORAGE_KEY) === "yes");
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => {
    if (entry.length === TEACHER_PIN.length) {
      if (entry === TEACHER_PIN) {
        try { sessionStorage.setItem(STORAGE_KEY, "yes"); } catch {}
        setAuthed(true);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setEntry(""); }, 400);
      }
    }
  }, [entry]);

  if (authed === null) return null;
  if (authed) return <>{children}</>;

  const press = (d: string) => {
    if (entry.length < TEACHER_PIN.length) setEntry(entry + d);
  };
  const back = () => setEntry(entry.slice(0, -1));

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <div className="text-6xl">🔒</div>
      <h1 className="text-3xl font-bold text-slate-700">Öğretmen Girişi</h1>
      <p className="text-slate-500">PIN gir (varsayılan: 1234)</p>

      <div className={`flex gap-3 ${shake ? "animate-pulse" : ""}`}>
        {Array.from({ length: TEACHER_PIN.length }).map((_, i) => (
          <div
            key={i}
            className={`w-14 h-16 rounded-2xl border-4 flex items-center justify-center text-3xl font-bold ${
              shake ? "border-rose-400 bg-rose-50" : "border-slate-300 bg-white"
            }`}
          >
            {entry[i] ? "•" : ""}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-2">
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="w-20 h-20 rounded-2xl bg-white shadow text-3xl font-bold hover:bg-sky-100 active:scale-95"
          >
            {d}
          </button>
        ))}
        <button
          onClick={back}
          className="w-20 h-20 rounded-2xl bg-slate-200 shadow text-2xl active:scale-95"
          aria-label="sil"
        >
          ⌫
        </button>
        <button
          onClick={() => press("0")}
          className="w-20 h-20 rounded-2xl bg-white shadow text-3xl font-bold hover:bg-sky-100 active:scale-95"
        >
          0
        </button>
        <a
          href="/"
          className="w-20 h-20 rounded-2xl bg-rose-100 shadow text-2xl flex items-center justify-center active:scale-95"
          aria-label="iptal"
        >
          ✕
        </a>
      </div>
    </main>
  );
}
