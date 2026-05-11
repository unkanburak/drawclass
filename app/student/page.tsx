"use client";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { EVENTS } from "@/lib/events";
import type { ClassroomSnapshot, Stroke, Point } from "@/lib/types";
import { StudentLoginGrid } from "@/components/StudentLoginGrid";
import { DrawingCanvas, type DrawingCanvasHandle } from "@/components/DrawingCanvas";
import { GuideDigit } from "@/components/GuideDigit";

// mavi · kırmızı · yeşil · pembe · turuncu
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#ec4899", "#f97316"];
const ROUND_COLORS = COLORS; // üstteki sayı rengi aynı 5 renkten döner

export default function StudentPage() {
  const [snapshot, setSnapshot] = useState<ClassroomSnapshot | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    const onSnap = (s: ClassroomSnapshot) => setSnapshot(s);
    const onRoundStart = () => canvasRef.current?.clear();
    socket.on(EVENTS.StateSnapshot, onSnap);
    socket.on(EVENTS.RoundStart, onRoundStart);
    return () => {
      socket.off(EVENTS.StateSnapshot, onSnap);
      socket.off(EVENTS.RoundStart, onRoundStart);
    };
  }, []);

  // Snapshot'ta görününce onayla; sonradan kaybolursa (teacher reset) login'e dön
  useEffect(() => {
    if (!myId || !snapshot) return;
    const inList = snapshot.students.some((s) => s.id === myId);
    if (inList) {
      confirmedRef.current = true;
    } else if (confirmedRef.current) {
      confirmedRef.current = false;
      setMyId(null);
    }
  }, [snapshot, myId]);

  if (!snapshot) {
    return (
      <main className="min-h-screen flex items-center justify-center text-3xl text-slate-500">
        ⏳ Bağlanıyor...
      </main>
    );
  }

  if (!myId) {
    return (
      <StudentLoginGrid
        onJoin={(name, avatar) => {
          const socket = getSocket();
          socket.emit(EVENTS.StudentClaim, { name, avatar });
          setMyId(socket.id ?? "unknown");
          document.documentElement.requestFullscreen?.().catch(() => {});
        }}
      />
    );
  }

  const me = snapshot.students.find((s) => s.id === myId);
  const roundActive = snapshot.status === "round-active";
  const roundIdx = snapshot.currentRoundIndex;
  const target = roundIdx >= 0 ? snapshot.roundSequence[roundIdx] : null;

  function emitStroke(stroke: Stroke) {
    getSocket().emit(EVENTS.StudentStroke, { stroke });
  }

  function emitPartial(points: Point[], color: string, size: number) {
    getSocket().emit(EVENTS.StudentStrokePartial, { points, color, size });
  }

  function clearMine() {
    canvasRef.current?.clear();
    getSocket().emit(EVENTS.StudentClearOwn);
  }

  return (
    <main className="fixed inset-0 bg-white overflow-hidden" style={{ fontFamily: "inherit" }}>

      {/* ── Üst banner: hedef sayı + tur sayacı ── */}
      <div
        className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-white/95 shadow-md"
        style={{ backdropFilter: "blur(4px)" }}
      >
        {/* Sol: avatar + isim */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-3xl">{me?.avatar ?? "🎨"}</span>
          <span className="font-bold text-slate-700 text-lg truncate">{me?.name}</span>
        </div>

        {/* Orta: büyük hedef sayı */}
        {roundActive && target !== null && (
          <div className="flex flex-col items-center leading-none">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Çiz</span>
            <span
              className="text-6xl font-bold leading-none"
              style={{ color: ROUND_COLORS[roundIdx % ROUND_COLORS.length] }}
            >
              {target}
            </span>
          </div>
        )}

        {/* Sağ: tur sayacı */}
        {roundIdx >= 0 && (
          <div className="text-right">
            <div className="text-xs text-slate-500">Tur</div>
            <div className="text-xl font-bold text-slate-700">
              {roundIdx + 1}/{snapshot.totalRounds}
            </div>
          </div>
        )}
      </div>

      {/* ── Çizim alanı (banner altında, kare, padding yok) ── */}
      <div className="fixed left-0 right-0 bottom-0 flex items-center justify-center" style={{ top: "72px" }}>
        <div
          className="relative bg-white"
          style={{
            aspectRatio: "1 / 1",
            width: "min(100%, calc(100dvh - 72px))",
            height: "min(100%, calc(100dvh - 72px))",
          }}
        >
          {/* Soluk kılavuz rakam — GuideDigit ve DrawingCanvas aynı kareyi paylaşıyor */}
          {roundActive && target !== null && <GuideDigit digit={target} />}

          {/* Çizim canvas'ı */}
          {roundActive && (
            <DrawingCanvas
              ref={canvasRef}
              color={color}
              brushSize={22}
              resetKey={roundIdx}
              onStrokeComplete={emitStroke}
              onPointsLive={emitPartial}
              disabled={false}
              style={{ zIndex: 10 }}
            />
          )}
        </div>
      </div>

      {/* ── Sol kenar renk & silgi (sadece aktif turda) ── */}
      {roundActive && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 bg-white/90 rounded-3xl p-3 shadow-lg">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-12 h-12 rounded-full shadow transition ${
                color === c ? "ring-4 ring-slate-800 scale-110" : "opacity-80"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`renk ${c}`}
            />
          ))}
          <button
            onClick={clearMine}
            className="w-12 h-12 rounded-full bg-slate-200 text-2xl shadow active:scale-95"
            title="Temizle"
          >
            🧽
          </button>
        </div>
      )}

      {/* ── Bekleme ekranı ── */}
      {!roundActive && snapshot.status !== "finished" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-amber-50">
          <div className="text-center">
            <div className="text-9xl mb-6 animate-wiggle inline-block">👋</div>
            <div className="text-3xl font-bold text-slate-700">
              Öğretmen başlatınca çiziyoruz!
            </div>
          </div>
        </div>
      )}

      {/* ── Ders bitti ── */}
      {snapshot.status === "finished" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-amber-50">
          <div className="text-center">
            <div className="text-9xl mb-6">🎉</div>
            <div className="text-3xl font-bold text-slate-700">Ders bitti! Aferin sana.</div>
          </div>
        </div>
      )}
    </main>
  );
}
