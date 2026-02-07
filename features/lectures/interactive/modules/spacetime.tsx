"use client";

import { useEffect } from "react";
import { setupCanvas, useCanvasSize } from "../core/canvas";

type SpacetimeParams = {
  velocity: number;
  separation: number;
  ticks: number;
};

export function SpacetimeModule({
  params,
}: {
  params: Record<string, number>;
}) {
  const { canvasRef, width, height, dpr } = useCanvasSize({
    height: 320,
    compactHeight: 250,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const ctx = setupCanvas(canvas, width, height, dpr);
    if (!ctx) return;

    const p = params as SpacetimeParams;
    const v = Math.max(0, Math.min(0.9, p.velocity));
    const ticks = Math.max(3, Math.round(p.ticks));
    const separation = p.separation;
    const gamma = 1 / Math.sqrt(1 - v * v);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const bottomY = height * 0.85;
    const scaleX = width * 0.32;
    const scaleY = height * 0.6;

    ctx.strokeStyle = "rgba(15,23,42,0.12)";
    ctx.beginPath();
    ctx.moveTo(centerX - scaleX, bottomY);
    ctx.lineTo(centerX + scaleX, bottomY);
    ctx.moveTo(centerX, bottomY);
    ctx.lineTo(centerX, bottomY - scaleY);
    ctx.stroke();

    const map = (x: number, t: number) => ({
      x: centerX + x * scaleX,
      y: bottomY - t * scaleY,
    });

    ctx.strokeStyle = "rgba(15,23,42,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, bottomY);
    ctx.lineTo(centerX, bottomY - scaleY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(245,158,11,0.8)";
    ctx.beginPath();
    ctx.moveTo(centerX, bottomY);
    ctx.lineTo(centerX + v * scaleX, bottomY - scaleY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(14,165,233,0.6)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= ticks; i += 1) {
      const t = i / (ticks + 1);
      const stationary = map(0, t);
      ctx.beginPath();
      ctx.moveTo(stationary.x - 6, stationary.y);
      ctx.lineTo(stationary.x + 6, stationary.y);
      ctx.stroke();

      const tau = i / (ticks + 1);
      const tMoving = Math.min(1, tau * gamma);
      const moving = map(v * tMoving, tMoving);
      ctx.beginPath();
      ctx.moveTo(moving.x - 6, moving.y);
      ctx.lineTo(moving.x + 6, moving.y);
      ctx.stroke();

      const light1 = map(-t * 0.9 * separation, t);
      const light2 = map(t * 0.9 * separation, t);
      ctx.strokeStyle = "rgba(14,116,144,0.25)";
      ctx.beginPath();
      ctx.moveTo(centerX, bottomY);
      ctx.lineTo(light1.x, light1.y);
      ctx.moveTo(centerX, bottomY);
      ctx.lineTo(light2.x, light2.y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(14,165,233,0.6)";
    }

    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.font = "12px sans-serif";
    ctx.fillText("ct", centerX + 6, bottomY - scaleY + 12);
    ctx.fillText("x", centerX + scaleX - 8, bottomY - 6);
  }, [canvasRef, width, height, dpr, params]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60 shadow-sm"
    />
  );
}
