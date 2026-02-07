"use client";

import { useEffect, useRef } from "react";
import { setupCanvas, useCanvasSize } from "../core/canvas";

type RandomWalkParams = {
  count: number;
  step: number;
  drift: number;
  spread: number;
};

type Walker = { x: number; y: number };

export function RandomWalkModule({
  params,
}: {
  params: Record<string, number>;
}) {
  const { canvasRef, width, height, dpr } = useCanvasSize({
    height: 320,
    compactHeight: 250,
  });
  const walkersRef = useRef<Walker[]>([]);

  useEffect(() => {
    const p = params as RandomWalkParams;
    const density = width > 0 && width < 520 ? 0.6 : 1;
    const count = Math.max(20, Math.round(p.count * density));
    walkersRef.current = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * p.spread,
      y: (Math.random() - 0.5) * p.spread,
    }));
  }, [params, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const ctx = setupCanvas(canvas, width, height, dpr);
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      const p = params as RandomWalkParams;
      const step = p.step;
      const drift = p.drift;

      const walkers = walkersRef.current;
      walkers.forEach((walker) => {
        walker.x += (Math.random() - 0.5) * step + drift;
        walker.y += (Math.random() - 0.5) * step;
      });

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const scale = Math.min(width, height) * 0.35;

      ctx.fillStyle = "rgba(15,23,42,0.65)";
      walkers.forEach((walker) => {
        const x = centerX + walker.x * scale;
        const y = centerY + walker.y * scale;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

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
