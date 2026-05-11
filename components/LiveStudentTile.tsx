"use client";
import { useEffect, useRef } from "react";
import type { ConnectedStudent, Rating, Stroke, Point } from "@/lib/types";
import { RatingButtons, RATING_EMOJI } from "./RatingButtons";
import { GuideDigit } from "./GuideDigit";

type LiveStroke = { points: Point[]; color: string; size: number } | null;

type Props = {
  student: ConnectedStudent;
  target: number | null;
  strokes: Stroke[];
  liveStroke: LiveStroke;
  rating?: Rating;
  onRate: (r: Rating) => void;
};

export function LiveStudentTile({ student, target, strokes, liveStroke, rating, onRate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    redraw();
  }, [strokes, liveStroke]); // eslint-disable-line react-hooks/exhaustive-deps

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;

    // Canvas pixel boyutunu ayarla
    if (canvas.width !== Math.round(rect.width * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Tamamlanmış stroke'lar
    drawStrokes(ctx, strokes, rect, 1);

    // Devam eden (partial) stroke — yarı saydam, ince
    if (liveStroke && liveStroke.points.length > 1) {
      ctx.save();
      ctx.globalAlpha = 0.65;
      drawStrokePoints(ctx, liveStroke.points, liveStroke.color, liveStroke.size, rect);
      ctx.restore();
    }

    ctx.restore();
  }

  return (
    <div
      className={`rounded-3xl shadow-lg overflow-hidden flex flex-col bg-white border-4 ${
        student.connected ? "border-green-300" : "border-slate-200 opacity-60"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{student.avatar}</span>
          <span className="font-bold truncate">{student.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {rating && <span className="text-2xl">{RATING_EMOJI[rating]}</span>}
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${student.connected ? "bg-green-500" : "bg-slate-400"}`} />
        </div>
      </div>
      <div className="relative aspect-square bg-amber-50">
        {/* Soluk kılavuz rakam — SVG ile konteynere oranlı */}
        {target !== null && <GuideDigit digit={target} />}
        {/* Çizimler canvas'da */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="p-2">
        <RatingButtons current={rating} onPick={onRate} size="sm" />
      </div>
    </div>
  );
}

function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  rect: DOMRect,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const stroke of strokes) {
    drawStrokePoints(ctx, stroke.points, stroke.color, stroke.size, rect);
  }
  ctx.restore();
}

function drawStrokePoints(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  originalSize: number,
  rect: DOMRect
) {
  if (points.length === 0) return;

  // Fırça boyutunu oranla
  const scaledSize = Math.max(1, (originalSize * rect.width) / 400);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = scaledSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Tek nokta ise daire çiz
  if (points.length === 1) {
    const p = points[0];
    ctx.beginPath();
    ctx.arc(p.x * rect.width, p.y * rect.height, scaledSize / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Çoklu noktalar — smooth çizgi
  ctx.beginPath();
  ctx.moveTo(points[0].x * rect.width, points[0].y * rect.height);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    ctx.lineTo(p.x * rect.width, p.y * rect.height);
  }
  ctx.stroke();
}
