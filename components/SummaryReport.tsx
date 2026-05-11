"use client";
import type { ClassroomSnapshot } from "@/lib/types";
import { RATING_EMOJI } from "./RatingButtons";

export function SummaryReport({
  snapshot,
  onReset
}: {
  snapshot: ClassroomSnapshot;
  onReset: () => void;
}) {
  const { students, drawings, roundSequence } = snapshot;
  return (
    <main className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-rose-500">🎉 Ders Özeti</h1>
        <button
          onClick={onReset}
          className="bg-sky-500 hover:bg-sky-600 text-white text-xl px-6 py-3 rounded-2xl shadow"
        >
          Yeni Ders Başlat
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-3xl shadow-lg">
        <table className="min-w-full text-center">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3 text-left">Öğrenci</th>
              {roundSequence.map((n, i) => (
                <th key={i} className="p-3">Tur {i + 1}<br/><span className="text-sky-500 text-xl">{n}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="p-3 text-left whitespace-nowrap">
                  <span className="text-2xl mr-2">{s.avatar}</span>
                  <span className="font-bold">{s.name}</span>
                </td>
                {roundSequence.map((_, i) => {
                  const r = drawings[s.id]?.[i]?.rating;
                  return (
                    <td key={i} className="p-3 text-3xl">
                      {r ? RATING_EMOJI[r] : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
