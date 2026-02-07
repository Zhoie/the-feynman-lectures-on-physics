"use client";

import { useEffect, useRef } from "react";
import { setupCanvas, useCanvasSize } from "../core/canvas";

type FieldMotionParams = {
  gravity: number;
  stiffness: number;
  damping: number;
  kick: number;
};

type FieldState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: Array<{ x: number; y: number }>;
};

export function FieldMotionModule({
  params,
}: {
  params: Record<string, number>;
}) {
  const { canvasRef, width, height, dpr } = useCanvasSize({
    height: 320,
    compactHeight: 250,
  });
  const stateRef = useRef<FieldState>({
    x: 0.6,
    y: 0,
    vx: 0,
    vy: 0,
    trail: [],
  });

  useEffect(() => {
    const p = params as FieldMotionParams;
    stateRef.current = {
      x: 0.6,
      y: 0,
      vx: p.kick,
      vy: 0,
      trail: [],
    };
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const ctx = setupCanvas(canvas, width, height, dpr);
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    const draw = (time: number) => {
      const dt = Math.min(0.02, (time - last) / 1000);
      last = time;

      const p = params as FieldMotionParams;
      const gravity = p.gravity * 4;
      const k = p.stiffness;
      const damping = p.damping * 1.4;

      const state = stateRef.current;
      const ax = -k * state.x - damping * state.vx;
      const ay = -k * state.y - damping * state.vy + gravity;

      state.vx += ax * dt;
      state.vy += ay * dt;
      state.x += state.vx * dt;
      state.y += state.vy * dt;

      state.trail.push({ x: state.x, y: state.y });
      if (state.trail.length > 80) state.trail.shift();

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.28;

      ctx.strokeStyle = "rgba(15,23,42,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(15,23,42,0.2)";
      ctx.beginPath();
      state.trail.forEach((point, index) => {
        const x = cx + point.x * scale;
        const y = cy + point.y * scale;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const px = cx + state.x * scale;
      const py = cy + state.y * scale;
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(15,23,42,0.35)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, width, height, dpr, params]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60 shadow-sm"
    />
  );
}
