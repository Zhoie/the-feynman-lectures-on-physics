"use client";

import { useEffect, useRef } from "react";
import { useCanvasAnimation, useCanvasSize } from "@/core/canvas/runtime";
import { useLazyRef } from "@/core/react/use-lazy-ref";
import {
  createRandomWalkState,
  stepRandomWalk,
  type RandomWalkParams,
  type RandomWalkState,
} from "../models/random-walk";
import {
  createSimLoopState,
  stepFixedSimulation,
} from "@/core/simulation/fixed-step";

export function RandomWalkModule({
  params,
}: {
  params: Record<string, number>;
}) {
  const { canvasRef, width, height, dpr } = useCanvasSize({
    height: 320,
    compactHeight: 250,
  });
  const stateRef = useRef<RandomWalkState | null>(null);
  const loopStateRef = useLazyRef(createSimLoopState);

  useEffect(() => {
    const p = params as RandomWalkParams;
    const density = width > 0 && width < 520 ? 0.6 : 1;
    const count = Math.max(20, Math.round(p.count * density));
    stateRef.current = createRandomWalkState(count, p.spread);
    loopStateRef.current = createSimLoopState();
  }, [loopStateRef, params, width]);

  useCanvasAnimation({
    canvasRef,
    width,
    height,
    dpr,
    draw: (ctx, frame) => {
      const p = params as RandomWalkParams;
      const state = stateRef.current;
      if (!state) return;
      const result = stepFixedSimulation(
        loopStateRef.current,
        frame.delta,
        { fixedDt: 1 / 60, maxSubSteps: 8, maxFrameDt: 1 / 12 },
        (dt) => stepRandomWalk(state, p, dt)
      );
      loopStateRef.current = result.state;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const scale = Math.min(width, height) * 0.35;

      ctx.fillStyle = "rgba(15,23,42,0.65)";
      state.walkers.forEach((walker) => {
        const x = centerX + walker.x * scale;
        const y = centerY + walker.y * scale;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    },
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60"
      role="img"
      aria-label="Particles following a deterministic random walk"
    >
      Random-walk particle simulation.
    </canvas>
  );
}
