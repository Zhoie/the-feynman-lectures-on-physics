"use client";

import { useEffect } from "react";
import { setupCanvas, useCanvasSize } from "../core/canvas";

type QuantumParams = {
  slitSeparation: number;
  phase: number;
  coherence: number;
  spread: number;
};

export function QuantumAmplitudeModule({
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

    const p = params as QuantumParams;
    const separation = p.slitSeparation;
    const phase = p.phase;
    const coherence = p.coherence;
    const spread = p.spread;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(0, 0, width, height);

    const centerY = height * 0.7;
    const centerX = width / 2;
    const scaleX = width * 0.35;
    const scaleY = height * 0.45;

    ctx.strokeStyle = "rgba(15,23,42,0.12)";
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    ctx.fillStyle = "rgba(14,116,144,0.2)";
    ctx.beginPath();
    for (let i = 0; i <= 300; i += 1) {
      const x = -1 + (i / 300) * 2;
      const fringe = Math.cos((x * separation * Math.PI * 2) + phase);
      const envelope = Math.exp(-(x * x) / (2 * spread * spread));
      const intensity = envelope * (1 + coherence * fringe);
      const xPos = centerX + x * scaleX;
      const yPos = centerY - intensity * scaleY;
      if (i === 0) ctx.moveTo(xPos, yPos);
      else ctx.lineTo(xPos, yPos);
    }
    ctx.lineTo(centerX + scaleX, centerY);
    ctx.lineTo(centerX - scaleX, centerY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(14,165,233,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 300; i += 1) {
      const x = -1 + (i / 300) * 2;
      const fringe = Math.cos((x * separation * Math.PI * 2) + phase);
      const envelope = Math.exp(-(x * x) / (2 * spread * spread));
      const intensity = envelope * (1 + coherence * fringe);
      const xPos = centerX + x * scaleX;
      const yPos = centerY - intensity * scaleY;
      if (i === 0) ctx.moveTo(xPos, yPos);
      else ctx.lineTo(xPos, yPos);
    }
    ctx.stroke();
  }, [canvasRef, width, height, dpr, params]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60 shadow-sm"
    />
  );
}
