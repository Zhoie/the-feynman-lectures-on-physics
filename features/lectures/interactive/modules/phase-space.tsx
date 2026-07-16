"use client";

import { useEffect, useRef } from "react";
import { useCanvasAnimation, useCanvasSize } from "@/core/canvas/runtime";
import { useLazyRef } from "@/core/react/use-lazy-ref";
import {
  createSimLoopState,
  stepFixedSimulation,
} from "@/core/simulation/fixed-step";

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
  const loopStateRef = useLazyRef(createSimLoopState);

  useEffect(() => {
    stateRef.current = { x: 1, v: 0, t: 0, trail: [] };
    loopStateRef.current = createSimLoopState();
  }, [loopStateRef, params]);

  useCanvasAnimation({
    canvasRef,
    width,
    height,
    dpr,
    draw: (ctx, frame) => {
      const p = params as PhaseParams;
      const omega = p.frequency;
      const zeta = p.damping;
      const drive = p.drive;
      const phase = p.phase;

      const state = stateRef.current;
      const result = stepFixedSimulation(
        loopStateRef.current,
        frame.delta,
        { fixedDt: 1 / 120, maxSubSteps: 16, maxFrameDt: 1 / 12 },
        (dt) => {
          const acceleration =
            -2 * zeta * omega * state.v -
            omega * omega * state.x +
            drive * Math.sin(omega * state.t + phase);
          state.v += acceleration * dt;
          state.x += state.v * dt;
          state.t += dt;
          state.trail.push({ x: state.x, v: state.v });
          if (state.trail.length > 240) state.trail.shift();
        }
      );
      loopStateRef.current = result.state;

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
    },
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60"
      role="img"
      aria-label="Oscillator position plotted against velocity"
    >
      Oscillator phase-space simulation.
    </canvas>
  );
}
