"use client";

import { useCanvasAnimation, useCanvasSize } from "@/core/canvas/runtime";
import {
  reactionCoordinateSummary,
  reactionPotential,
  type ReactionCoordinateParams,
} from "../models/reaction-coordinate";

function pseudo(index: number, salt = 0) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function ReactionCoordinateModule({
  params,
}: {
  params: Record<string, number>;
}) {
  const { canvasRef, width, height, dpr } = useCanvasSize({
    height: 320,
    compactHeight: 250,
  });

  useCanvasAnimation({
    canvasRef,
    width,
    height,
    dpr,
    draw: (ctx, frame) => {
      const p = params as ReactionCoordinateParams;
      const t = frame.elapsed;
      const heat = Math.max(0.08, Math.min(1, p.temperature / 2));
      const summary = reactionCoordinateSummary(p);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(0, 0, width, height);

      const pad = 34;
      const x0 = pad;
      const x1 = width - pad;
      const y0 = pad;
      const y1 = height - pad;
      const samples = 90;
      const values: number[] = [];
      const points: Array<{ x: number; y: number }> = [];
      const domainMin = -1.45;
      const domainMax = 1.45;

      for (let i = 0; i < samples; i += 1) {
        const x =
          domainMin + (i / (samples - 1)) * (domainMax - domainMin);
        const y = reactionPotential(x, p);
        values.push(y);
        points.push({ x, y });
      }

      const minY = Math.min(...values) - 0.25;
      const maxY = Math.max(...values) + 0.35;
      const mapX = (x: number) =>
        x0 + ((x - domainMin) / (domainMax - domainMin)) * (x1 - x0);
      const mapY = (y: number) => y1 - ((y - minY) / (maxY - minY)) * (y1 - y0);

      ctx.strokeStyle = "rgba(15,23,42,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y1);
      ctx.lineTo(x1, y1);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y1);
      ctx.stroke();

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point, index) => {
        const x = mapX(point.x);
        const y = mapY(point.y);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.strokeStyle =
        p.catalyst >= 0.5
          ? "rgba(16,185,129,0.8)"
          : "rgba(245,158,11,0.65)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(mapX(0), mapY(summary.reactantEnergy));
      ctx.lineTo(mapX(0), mapY(summary.transitionEnergy));
      ctx.stroke();
      ctx.setLineDash([]);

      const particleCount = 42;
      for (let i = 0; i < particleCount; i += 1) {
        const phase = pseudo(i, 1) + t * (0.05 + summary.crossingLikelihood * 0.7);
        const crossed =
          phase % 1 > 1 - Math.min(0.5, summary.crossingLikelihood * 2.6);
        const baseX = crossed ? 1 : -1;
        const jitter = (pseudo(i, 2) - 0.5) * (0.32 + heat * 0.45);
        const thermalJump = Math.sin(t * (1.4 + heat * 4) + i) * heat * 0.18;
        const xDomain = baseX + jitter + thermalJump;
        const yDomain = reactionPotential(xDomain, p);
        const x = mapX(xDomain);
        const y = mapY(yDomain) - 5 - pseudo(i, 3) * 8;

        ctx.fillStyle = crossed ? "rgba(14,165,233,0.78)" : "rgba(15,23,42,0.68)";
        ctx.beginPath();
        ctx.arc(x, y, 2.5 + heat * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#0f172a";
      ctx.font = "500 12px system-ui";
      ctx.fillText("reactants", mapX(-1.25), y1 + 20);
      ctx.fillText("products", mapX(0.85), y1 + 20);
      ctx.fillText(
        `relative crossing ${summary.crossingLikelihood.toFixed(2)}`,
        x0 + 6,
        y0 + 18
      );
      ctx.fillText(
        p.catalyst >= 0.5 ? "catalyst lowers barrier" : "uncatalyzed barrier",
        x0 + 6,
        y0 + 36
      );
    },
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60"
      role="img"
      aria-label="Reaction energy landscape and relative barrier-crossing likelihood"
    >
      Qualitative reaction-coordinate simulation.
    </canvas>
  );
}
