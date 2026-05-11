"use client";
import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import type { Stroke, Point } from "@/lib/types";

export type DrawingCanvasHandle = { clear: () => void };

type Props = {
  color: string;
  brushSize: number;
  onStrokeComplete: (stroke: Stroke) => void;
  /** Her ~15 noktada bir canlı stream için (opsiyonel). */
  onPointsLive?: (points: Point[], color: string, size: number) => void;
  resetKey: string | number;
  disabled?: boolean;
  style?: React.CSSProperties;
};

function newStrokeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const LIVE_THROTTLE = 15; // her 15 noktada bir emit

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { color, brushSize, onStrokeComplete, onPointsLive, resetKey, disabled, style },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const pointsSinceEmitRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }, [resetKey]);

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }));

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  }

  function toCanvasCoord(p: Point): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: p.x * rect.width, y: p.y * rect.height };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    pointsSinceEmitRef.current = 0;
    const p = getPoint(e);
    currentStrokeRef.current = { id: newStrokeId(), color, size: brushSize, points: [p] };
    lastPointRef.current = p;
    const ctx = canvasRef.current!.getContext("2d")!;
    const cp = toCanvasCoord(p);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(cp.x, cp.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return;
    const p = getPoint(e);
    const last = lastPointRef.current;
    if (!last) return;

    const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
    const ctx = canvasRef.current!.getContext("2d")!;
    const a = toCanvasCoord(last);
    const m = toCanvasCoord(mid);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(a.x, a.y, m.x, m.y);
    ctx.stroke();

    currentStrokeRef.current?.points.push(p);
    lastPointRef.current = p;
    pointsSinceEmitRef.current += 1;

    // Her LIVE_THROTTLE noktada bir canlı stream
    if (onPointsLive && pointsSinceEmitRef.current >= LIVE_THROTTLE) {
      pointsSinceEmitRef.current = 0;
      const pts = currentStrokeRef.current?.points;
      if (pts && pts.length > 0) onPointsLive([...pts], color, brushSize);
    }
  }

  function onPointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    lastPointRef.current = null;
    pointsSinceEmitRef.current = 0;
    if (stroke && stroke.points.length > 0) onStrokeComplete(stroke);
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full no-touch-scroll"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    />
  );
});
