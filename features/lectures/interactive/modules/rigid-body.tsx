"use client";

import { useEffect, useRef } from "react";
import * as planck from "planck";
import { setupCanvas, useCanvasSize } from "../core/canvas";

type RigidParams = {
  gravity: number;
  restitution: number;
  friction: number;
  launch: number;
};

type WorldState = {
  world: planck.World;
  boxes: planck.Body[];
};

function createWorld(params: RigidParams) {
  const world = new planck.World(planck.Vec2(0, -params.gravity));
  const ground = world.createBody();
  ground.createFixture(planck.Edge(planck.Vec2(-6, 0), planck.Vec2(6, 0)), {
    friction: params.friction,
    restitution: params.restitution,
  });

  const boxA = world.createDynamicBody(planck.Vec2(-2.2, 4.5));
  boxA.createFixture(planck.Box(0.6, 0.6), {
    density: 1,
    friction: params.friction,
    restitution: params.restitution,
  });
  boxA.setLinearVelocity(planck.Vec2(params.launch, 0));

  const boxB = world.createDynamicBody(planck.Vec2(2.2, 6));
  boxB.createFixture(planck.Box(0.7, 0.7), {
    density: 1,
    friction: params.friction,
    restitution: params.restitution,
  });

  return { world, boxes: [boxA, boxB] };
}

export function RigidBodyModule({
  params,
}: {
  params: Record<string, number>;
}) {
  const { canvasRef, width, height, dpr } = useCanvasSize({
    height: 320,
    compactHeight: 250,
  });
  const worldRef = useRef<WorldState | null>(null);

  useEffect(() => {
    worldRef.current = createWorld(params as RigidParams);
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const ctx = setupCanvas(canvas, width, height, dpr);
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      const state = worldRef.current;
      if (!state) return;

      state.world.step(1 / 60);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(0, 0, width, height);

      const scale = width / 12;
      const originX = width / 2;
      const originY = height * 0.82;

      ctx.strokeStyle = "rgba(15,23,42,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX - 6 * scale, originY);
      ctx.lineTo(originX + 6 * scale, originY);
      ctx.stroke();

      state.boxes.forEach((body, index) => {
        const fixture = body.getFixtureList();
        const shape = fixture?.getShape();
        if (!shape || shape.getType() !== "polygon") return;

        const vertices = (shape as planck.Polygon).m_vertices;
        ctx.beginPath();
        vertices.forEach((vertex, i) => {
          const worldPoint = body.getWorldPoint(vertex);
          const x = originX + worldPoint.x * scale;
          const y = originY - worldPoint.y * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle =
          index === 0 ? "rgba(245,158,11,0.85)" : "rgba(14,165,233,0.75)";
        ctx.fill();
        ctx.strokeStyle = "rgba(15,23,42,0.4)";
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, width, height, dpr]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height, touchAction: "none" }}
      className="w-full rounded-2xl border border-slate-900/10 bg-white/60 shadow-sm"
    />
  );
}
