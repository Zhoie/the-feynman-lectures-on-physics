import { useEffect, useMemo, useRef, useState } from "react";

type CanvasSize = {
  width: number;
  height: number;
  dpr: number;
};

export function useCanvasSize({
  height = 320,
  compactHeight = 260,
  compactBreakpoint = 540,
}: {
  height?: number;
  compactHeight?: number;
  compactBreakpoint?: number;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<CanvasSize>({
    width: 0,
    height,
    dpr: 1,
  });

  const dpr = useMemo(
    () => (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const targetHeight =
        parent.clientWidth < compactBreakpoint ? compactHeight : height;
      setSize({
        width: parent.clientWidth,
        height: targetHeight,
        dpr,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [height, compactHeight, compactBreakpoint, dpr]);

  return { canvasRef, ...size };
}

export function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number
) {
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  const context = canvas.getContext("2d");
  if (context) {
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return context;
}
