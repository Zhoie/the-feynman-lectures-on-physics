"use client";

import { useEffect } from "react";
import { setupCanvas, useCanvasSize } from "../core/canvas";

type FieldParams = {
  chargeA: number;
  chargeB: number;
  separation: number;
  strength: number;
};

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number
) {
  const angle = Math.atan2(dy, dx);
  const len = Math.hypot(dx, dy);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  if (len > 2) {
    const head = 4;
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(
      x + dx - head * Math.cos(angle - Math.PI / 6),
      y + dy - head * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x + dx - head * Math.cos(angle + Math.PI / 6),
      y + dy - head * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }
}

export function VectorFieldModule({
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

    const p = params as FieldParams;
    const sep = p.separation;
    const chargeA = p.chargeA;
    const chargeB = p.chargeB;
    const strength = p.strength;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.2;

    const charges = [
      { q: chargeA, x: -sep / 2, y: 0 },
      { q: chargeB, x: sep / 2, y: 0 },
    ];

    ctx.strokeStyle = "rgba(15,23,42,0.2)";
    ctx.fillStyle = "rgba(15,23,42,0.6)";

    const gridX = width < 520 ? 9 : 12;
    const gridY = width < 520 ? 6 : 7;

    for (let i = 0; i <= gridX; i += 1) {
      for (let j = 0; j <= gridY; j += 1) {
        const x = -3 + (i / gridX) * 6;
        const y = -2 + (j / gridY) * 4;
        let fx = 0;
        let fy = 0;
        charges.forEach((charge) => {
          const dx = x - charge.x;
          const dy = y - charge.y;
          const r2 = dx * dx + dy * dy + 0.08;
          const inv = (charge.q * strength) / Math.pow(r2, 1.5);
          fx += dx * inv;
          fy += dy * inv;
        });
        const mag = Math.min(0.6, Math.hypot(fx, fy));
        const nx = fx === 0 && fy === 0 ? 0 : (fx / Math.hypot(fx, fy)) * mag;
        const ny = fx === 0 && fy === 0 ? 0 : (fy / Math.hypot(fx, fy)) * mag;
        const px = centerX + x * scale;
        const py = centerY + y * scale;
        drawArrow(ctx, px, py, nx * scale * 0.4, ny * scale * 0.4);
      }
    }

    charges.forEach((charge) => {
      ctx.beginPath();
      ctx.fillStyle = charge.q >= 0 ? "rgba(245,158,11,0.9)" : "rgba(14,116,144,0.9)";
      ctx.arc(
        centerX + charge.x * scale,
        centerY + charge.y * scale,
        10,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(charge.q >= 0 ? "+" : "-", centerX + charge.x * scale, centerY + charge.y * scale);
    });
  }, [canvasRef, width, height, dpr, params]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60 shadow-sm"
    />
  );
}
