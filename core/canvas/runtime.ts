import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";

export type CanvasSize = {
  width: number;
  height: number;
  dpr: number;
};

export type CanvasAnimationFrame = CanvasSize & {
  delta: number;
  elapsed: number;
  now: number;
};

export type CanvasRuntimeControl = {
  paused?: boolean;
  onError?: (error: Error) => void;
};

export const CanvasRuntimeContext =
  createContext<CanvasRuntimeControl | null>(null);

export function normalizePixelRatio(value: number, maximum = 2) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(value, Math.max(1, maximum));
}

export function clampFrameDelta(value: number, maximum = 1 / 12) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, Math.max(0, maximum));
}

export function normalizeAnimationError(cause: unknown) {
  return cause instanceof Error
    ? cause
    : new Error("The canvas animation stopped unexpectedly.");
}

export function useCanvasSize({
  height = 320,
  compactHeight = 260,
  compactBreakpoint = 540,
  maxPixelRatio = 2,
}: {
  height?: number;
  compactHeight?: number;
  compactBreakpoint?: number;
  maxPixelRatio?: number;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<CanvasSize>({
    width: 0,
    height,
    dpr: 1,
  });

  const dpr = useMemo(
    () =>
      normalizePixelRatio(
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        maxPixelRatio,
      ),
    [maxPixelRatio],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const targetHeight =
        parent.clientWidth < compactBreakpoint ? compactHeight : height;
      const targetWidth = Math.max(1, Math.round(parent.clientWidth));
      setSize((current) => {
        if (
          current.width === targetWidth &&
          current.height === targetHeight &&
          current.dpr === dpr
        ) {
          return current;
        }
        return {
          width: targetWidth,
          height: targetHeight,
          dpr,
        };
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [height, compactHeight, compactBreakpoint, dpr]);

  return { canvasRef, ...size };
}

export function useCanvasAnimation({
  canvasRef,
  width,
  height,
  dpr,
  draw,
  animate = true,
  maxFps = 60,
  maxFrameDelta = 1 / 12,
  redrawKey,
  paused = false,
  onError,
}: CanvasSize & {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  draw: (
    context: CanvasRenderingContext2D,
    frame: CanvasAnimationFrame,
  ) => void;
  animate?: boolean;
  maxFps?: number;
  maxFrameDelta?: number;
  redrawKey?: unknown;
  paused?: boolean;
  onError?: (error: Error) => void;
}) {
  const runtimeControl = useContext(CanvasRuntimeContext);
  const shouldAnimate =
    animate && !paused && !(runtimeControl?.paused ?? false);
  const drawFrame = useEffectEvent(draw);
  const reportError = useEffectEvent((error: Error) => {
    if (onError) onError(error);
    if (runtimeControl?.onError) runtimeControl.onError(error);
    if (!onError && !runtimeControl?.onError) {
      console.error("[canvas-animation]", error);
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    const context = setupCanvas(canvas, width, height, dpr);
    if (!context) return;

    let animationFrame: number | null = null;
    let lastTime: number | null = null;
    let elapsed = 0;
    let pageVisible = document.visibilityState !== "hidden";
    let canvasVisible = true;
    const minimumFrameInterval =
      Number.isFinite(maxFps) && maxFps > 0 ? 1000 / maxFps : 0;

    void redrawKey;

    const stop = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      lastTime = null;
    };

    const frame = (time: number) => {
      animationFrame = null;
      if (!pageVisible || !canvasVisible) return;

      if (
        shouldAnimate &&
        lastTime !== null &&
        time - lastTime < minimumFrameInterval - 0.5
      ) {
        animationFrame = requestAnimationFrame(frame);
        return;
      }

      const delta =
        lastTime === null
          ? 0
          : clampFrameDelta((time - lastTime) / 1000, maxFrameDelta);
      lastTime = time;
      elapsed += delta;
      try {
        drawFrame(context, {
          width,
          height,
          dpr,
          delta,
          elapsed,
          now: time / 1000,
        });
      } catch (cause) {
        stop();
        reportError(normalizeAnimationError(cause));
        return;
      }
      if (shouldAnimate) {
        animationFrame = requestAnimationFrame(frame);
      }
    };

    const start = () => {
      if (animationFrame === null && pageVisible && canvasVisible) {
        animationFrame = requestAnimationFrame(frame);
      }
    };

    const syncVisibility = () => {
      if (pageVisible && canvasVisible) start();
      else stop();
    };

    const handlePageVisibility = () => {
      pageVisible = document.visibilityState !== "hidden";
      syncVisibility();
    };

    document.addEventListener("visibilitychange", handlePageVisibility);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              canvasVisible = entry?.isIntersecting ?? true;
              syncVisibility();
            },
            { rootMargin: "120px" },
          );
    observer?.observe(canvas);
    start();

    return () => {
      stop();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", handlePageVisibility);
    };
  }, [
    canvasRef,
    dpr,
    height,
    maxFps,
    maxFrameDelta,
    redrawKey,
    shouldAnimate,
    width,
  ]);
}

export function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number,
) {
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  const context = canvas.getContext("2d");
  if (context) {
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return context;
}
