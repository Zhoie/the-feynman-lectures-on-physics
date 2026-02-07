"use client";

import { useEffect, useRef } from "react";
import { setupCanvas, useCanvasSize } from "../core/canvas";

type PhaseParams = {
  frequency: number;
  damping: number;
  drive: number;
  phase: number;
};

type PhaseState = {
  x: number;
  v: number;
  t: number;
  trail: Array<{ x: number; v: number }>;
};

export function PhaseSpaceModule({
  params,
}: {
  params: Record<string, number>;
}) {
  const { canvasRef, width, height, dpr } = useCanvasSize({
    height: 320,
    compactHeight: 250,
  });
  const stateRef = useRef<PhaseState>({
    x: 1,
    v: 0,
    t: 0,
    trail: [],
  });

  useEffect(() => {
    stateRef.current = { x: 1, v: 0, t: 0, trail: [] };
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

      const p = params as PhaseParams;
      const omega = p.frequency;
      const zeta = p.damping;
      const drive = p.drive;
      const phase = p.phase;

      const state = stateRef.current;
      for (let i = 0; i < 3; i += 1) {
        const a =
          -2 * zeta * omega * state.v -
          omega * omega * state.x +
          drive * Math.sin(omega * state.t + phase);
        state.v += a * dt;
        state.x += state.v * dt;
        state.t += dt;
        state.trail.push({ x: state.x, v: state.v });
        if (state.trail.length > 180) state.trail.shift();
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const scale = Math.min(width, height) * 0.28;

      ctx.strokeStyle = "rgba(15,23,42,0.12)";
      ctx.beginPath();
      ctx.moveTo(centerX - scale, centerY);
      ctx.lineTo(centerX + scale, centerY);
      ctx.moveTo(centerX, centerY - scale);
      ctx.lineTo(centerX, centerY + scale);
      ctx.stroke();

      ctx.strokeStyle = "rgba(14,116,144,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      state.trail.forEach((point, index) => {
        const x = centerX + point.x * scale;
        const y = centerY - point.v * scale;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

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
