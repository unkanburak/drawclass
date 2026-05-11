"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { EVENTS } from "@/lib/events";
import type { ClassroomSnapshot, Rating, Stroke, Point, RoundDrawing } from "@/lib/types";
import { LiveStudentTile } from "./LiveStudentTile";
import { SummaryReport } from "./SummaryReport";

/** Şu anda çizilmekte olan yarım stroke (henüz pointerUp olmadı). */
type LiveStroke = { points: Point[]; color: string; size: number };

export function TeacherDashboard() {
  const [snapshot, setSnapshot] = useState<ClassroomSnapshot | null>(null);
  /** { [studentId]: LiveStroke | null } — pointerUp gelince null olur */
  const [liveStrokes, setLiveStrokes] = useState<Record<string, LiveStroke | null>>({});

  useEffect(() => {
    const socket = getSocket();

    const rejoin = () => socket.emit(EVENTS.TeacherJoin);
    rejoin();
    socket.on("connect", rejoin);

    const onSnap = (s: ClassroomSnapshot) => setSnapshot(s);

    const onDrawingUpdate = (payload: {
      studentId: string;
      roundIdx: number;
      stroke?: Stroke;
      replace?: boolean;
      strokes?: Stroke[];
    }) => {
      // Tamamlanan stroke geldi → live stroke'u sil
      setLiveStrokes((prev) => ({ ...prev, [payload.studentId]: null }));

      setSnapshot((prev) => {
        if (!prev) return prev;
        const drawings = { ...prev.drawings };
        const studentDrawings = { ...(drawings[payload.studentId] || {}) };
        const slot: RoundDrawing = {
          ...(studentDrawings[payload.roundIdx] || { strokes: [] })
        };
        if (payload.replace) {
          slot.strokes = payload.strokes || [];
        } else if (payload.stroke) {
          slot.strokes = [...slot.strokes, payload.stroke];
        }
        studentDrawings[payload.roundIdx] = slot;
        drawings[payload.studentId] = studentDrawings;
        return { ...prev, drawings };
      });
    };

    const onStrokePartial = (payload: {
      studentId: string;
      roundIdx: number;
      points: Point[];
      color: string;
      size: number;
    }) => {
      setLiveStrokes((prev) => ({
        ...prev,
        [payload.studentId]: {
          points: payload.points,
          color: payload.color,
          size: payload.size
        }
      }));
    };

    const onRatingUpdated = (p: { studentId: string; roundIdx: number; rating: Rating }) => {
      setSnapshot((prev) => {
        if (!prev) return prev;
        const drawings = { ...prev.drawings };
        const studentDrawings = { ...(drawings[p.studentId] || {}) };
        const slot: RoundDrawing = { ...(studentDrawings[p.roundIdx] || { strokes: [] }) };
        slot.rating = p.rating;
        studentDrawings[p.roundIdx] = slot;
        drawings[p.studentId] = studentDrawings;
        return { ...prev, drawings };
      });
    };

    socket.on(EVENTS.StateSnapshot, onSnap);
    socket.on(EVENTS.StudentDrawingUpdate, onDrawingUpdate);
    socket.on(EVENTS.StudentStrokePartial, onStrokePartial);
    socket.on(EVENTS.RatingUpdated, onRatingUpdated);

    return () => {
      socket.off("connect", rejoin);
      socket.off(EVENTS.StateSnapshot, onSnap);
      socket.off(EVENTS.StudentDrawingUpdate, onDrawingUpdate);
      socket.off(EVENTS.StudentStrokePartial, onStrokePartial);
      socket.off(EVENTS.RatingUpdated, onRatingUpdated);
    };
  }, []);

  if (!snapshot) {
    return (
      <main className="min-h-screen flex items-center justify-center text-3xl">
        ⏳ Bağlanıyor...
      </main>
    );
  }

  if (snapshot.status === "finished") {
    return (
      <SummaryReport
        snapshot={snapshot}
        onReset={() => getSocket().emit(EVENTS.TeacherResetSession)}
      />
    );
  }

  const roundIdx = snapshot.currentRoundIndex;
  const target = roundIdx >= 0 ? snapshot.roundSequence[roundIdx] : null;
  const connectedCount = snapshot.students.filter((s) => s.connected).length;

  function startOrNext() {
    if (snapshot!.status === "lobby") {
      getSocket().emit(EVENTS.TeacherStartRound);
    } else {
      getSocket().emit(EVENTS.TeacherNextRound);
    }
  }

  function endSession() {
    if (confirm("Dersi bitirip özet ekranına geçilsin mi?")) {
      getSocket().emit(EVENTS.TeacherEndSession);
    }
  }

  function rate(studentId: string, rating: Rating) {
    if (roundIdx < 0) return;
    getSocket().emit(EVENTS.TeacherRate, { studentId, roundIdx, rating });
  }

  const isLastRound = roundIdx === snapshot.totalRounds - 1;

  return (
    <main className="min-h-screen p-4">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-white rounded-3xl shadow-lg p-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🧑‍🏫</span>
          <div>
            <div className="text-sm text-slate-500">Sınıf — bağlı öğrenci</div>
            <div className="text-2xl font-bold">{connectedCount} / {snapshot.students.length}</div>
          </div>
        </div>
        <div className="text-center">
          {roundIdx >= 0 ? (
            <>
              <div className="text-slate-500">Tur</div>
              <div className="text-3xl font-bold">
                {roundIdx + 1}/{snapshot.totalRounds} —{" "}
                <span className="text-sky-500">Hedef: {target}</span>
              </div>
            </>
          ) : (
            <div className="text-2xl text-slate-500">Henüz başlamadı</div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={startOrNext}
            className="bg-green-500 hover:bg-green-600 text-white text-xl px-6 py-3 rounded-2xl shadow active:scale-95"
          >
            {snapshot.status === "lobby"
              ? "▶ Turu Başlat"
              : isLastRound
              ? "🏁 Bitir"
              : "Sonraki Tur ▶"}
          </button>
          {snapshot.status !== "lobby" && (
            <button
              onClick={endSession}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xl px-6 py-3 rounded-2xl shadow active:scale-95"
            >
              Dersi Bitir
            </button>
          )}
        </div>
      </header>

      {snapshot.students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <span className="text-7xl">🪑</span>
          <p className="text-2xl font-semibold">Henüz kimse katılmadı</p>
          <p className="text-lg">Öğrenciler <strong>/student</strong> sayfasından giriş yapınca burada görünürler.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {snapshot.students.map((s) => {
            const slot = roundIdx >= 0 ? snapshot.drawings[s.id]?.[roundIdx] : undefined;
            return (
              <LiveStudentTile
                key={s.id}
                student={s}
                target={target}
                strokes={slot?.strokes || []}
                liveStroke={liveStrokes[s.id] ?? null}
                rating={slot?.rating}
                onRate={(r) => rate(s.id, r)}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
