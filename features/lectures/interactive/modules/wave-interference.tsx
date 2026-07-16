"use client";

import { useCanvasAnimation, useCanvasSize } from "@/core/canvas/runtime";

type WaveParams = {
  amplitude: number;
  frequency: number;
  phase: number;
  speed: number;
};

export function WaveInterferenceModule({
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
      const p = params as WaveParams;
      const amp = p.amplitude;
      const freq = p.frequency;
      const phase = p.phase;
      const speed = p.speed;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(0, 0, width, height);

      const mid = height / 2;
      const scale = height * 0.32;

      ctx.strokeStyle = "rgba(15,23,42,0.15)";
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(width, mid);
      ctx.stroke();

      ctx.strokeStyle = "rgba(14,116,144,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const t = (x / width) * Math.PI * 2;
        const y1 = Math.sin(t * freq - frame.elapsed * speed);
        const y2 = Math.sin(t * (freq * 0.9) - frame.elapsed * speed + phase);
        const y = mid + (y1 + y2) * 0.5 * amp * scale;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(14,165,233,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const t = (x / width) * Math.PI * 2;
        const y1 = Math.sin(t * freq - frame.elapsed * speed);
        const y2 = Math.sin(t * (freq * 0.9) - frame.elapsed * speed + phase);
        const y = mid + (y1 + y2) * amp * scale;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60"
      role="img"
      aria-label="Two waves combining through interference"
    >
      Wave-interference simulation.
    </canvas>
  );
}
