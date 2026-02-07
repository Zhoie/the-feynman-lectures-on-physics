"use client";

import { useEffect } from "react";
import { setupCanvas, useCanvasSize } from "../core/canvas";

type CircuitParams = {
  naturalFreq: number;
  dampingRatio: number;
  drive: number;
  phase: number;
};

export function CircuitResponseModule({
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

    const p = params as CircuitParams;
    const w0 = p.naturalFreq;
    const zeta = p.dampingRatio;
    const drive = p.drive;
    const phase = p.phase;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(0, 0, width, height);

    const left = 24;
    const right = width - 24;
    const top = 24;
    const bottom = height - 24;

    ctx.strokeStyle = "rgba(15,23,42,0.12)";
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.stroke();

    const duration = 8;
    ctx.strokeStyle = "rgba(14,165,233,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i <= 240; i += 1) {
      const t = (i / 240) * duration;
      let y = 0;
      if (zeta < 1) {
        const wd = w0 * Math.sqrt(1 - zeta * zeta);
        const envelope = Math.exp(-zeta * w0 * t);
        y =
          drive *
          (1 -
            envelope *
              (Math.cos(wd * t + phase) +
                (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t + phase)));
      } else {
        y = drive * (1 - Math.exp(-w0 * t));
      }
      const xPos = left + (i / 240) * (right - left);
      const yPos = bottom - y * (bottom - top) * 0.8;
      if (i === 0) ctx.moveTo(xPos, yPos);
      else ctx.lineTo(xPos, yPos);
    }

    ctx.stroke();

    ctx.strokeStyle = "rgba(15,23,42,0.2)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(left, bottom - (bottom - top) * 0.8);
    ctx.lineTo(right, bottom - (bottom - top) * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [canvasRef, width, height, dpr, params]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60 shadow-sm"
    />
  );
}
