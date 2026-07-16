"use client";

import { useCanvasAnimation, useCanvasSize } from "@/core/canvas/runtime";
import {
  phaseExchangeRates,
  type PhaseExchangeParams,
} from "../models/phase-exchange";

function pseudo(index: number, salt = 0) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function wrap01(value: number) {
  return ((value % 1) + 1) % 1;
}

export function PhaseExchangeModule({
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
      const p = params as PhaseExchangeParams;
      const t = frame.elapsed;
      const rates = phaseExchangeRates(p);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(0, 0, width, height);

      const pad = 28;
      const waterY = height * 0.62;
      const waterH = height - waterY - pad;

      const vaporGradient = ctx.createLinearGradient(0, pad, 0, waterY);
      vaporGradient.addColorStop(0, "rgba(14,165,233,0.08)");
      vaporGradient.addColorStop(1, "rgba(14,165,233,0.18)");
      ctx.fillStyle = vaporGradient;
      ctx.fillRect(pad, pad, width - pad * 2, waterY - pad);

      const waterGradient = ctx.createLinearGradient(0, waterY, 0, height - pad);
      waterGradient.addColorStop(0, "rgba(56,189,248,0.36)");
      waterGradient.addColorStop(1, "rgba(2,132,199,0.18)");
      ctx.fillStyle = waterGradient;
      ctx.fillRect(pad, waterY, width - pad * 2, waterH);

      ctx.strokeStyle = "rgba(15,23,42,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

      for (let i = 0; i < 54; i += 1) {
        const x = pad + pseudo(i, 1) * (width - pad * 2);
        const swim = Math.sin(t * (0.8 + rates.temperature * 2) + i) * 8;
        const y = Math.max(
          waterY + 5,
          Math.min(
            height - pad - 5,
            waterY + 16 + pseudo(i, 2) * (waterH - 28) + swim
          )
        );
        ctx.fillStyle = i % 5 === 0 ? "#0ea5e9" : "rgba(15,23,42,0.55)";
        ctx.beginPath();
        ctx.arc(x, y, i % 5 === 0 ? 3.2 : 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 30; i += 1) {
        const phase = wrap01(
          pseudo(i, 3) + t * (0.08 + rates.evaporation * 0.26)
        );
        const x =
          pad +
          wrap01(pseudo(i, 4) + Math.sin(t * 0.7 + i) * 0.03) *
            (width - pad * 2);
        const y = waterY - phase * (waterY - pad - 10);
        ctx.fillStyle = "rgba(14,165,233,0.5)";
        ctx.beginPath();
        ctx.arc(x, y, 1.8 + rates.evaporation * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 18; i += 1) {
        const phase = wrap01(
          pseudo(i, 5) + t * (0.06 + rates.condensation * 0.22)
        );
        const x = pad + pseudo(i, 6) * (width - pad * 2);
        const y = pad + phase * (waterY - pad);
        ctx.fillStyle = "rgba(2,132,199,0.62)";
        ctx.beginPath();
        ctx.arc(x, y, 2.5 + rates.condensation * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      const crystalCount = Math.round(
        16 * (1 - rates.dissolution) + rates.salt * 18
      );
      ctx.fillStyle = "rgba(15,23,42,0.45)";
      for (let i = 0; i < crystalCount; i += 1) {
        const x = pad + 18 + pseudo(i, 7) * (width - pad * 2 - 36);
        const y = height - pad - 10 - pseudo(i, 8) * 18;
        ctx.fillRect(x, y, 5, 5);
      }

      ctx.fillStyle = "#0f172a";
      ctx.font = "500 12px system-ui";
      ctx.fillText(
        `relative evaporation ${rates.evaporation.toFixed(2)}`,
        pad + 8,
        pad + 20
      );
      ctx.fillText(
        `relative condensation ${rates.condensation.toFixed(2)}`,
        pad + 8,
        pad + 38
      );
      ctx.fillText(
        `relative dissolution ${rates.dissolution.toFixed(2)}`,
        pad + 8,
        height - pad - 12
      );
    },
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60"
      role="img"
      aria-label="Qualitative evaporation, condensation, and dissolution rates"
    >
      Qualitative phase-exchange simulation.
    </canvas>
  );
}
