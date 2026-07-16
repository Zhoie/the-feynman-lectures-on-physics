"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { useCanvasAnimation, useCanvasSize } from "@/core/canvas/runtime";
import { useAnimationPlayback } from "@/core/canvas/playback";
import { useLazyRef } from "@/core/react/use-lazy-ref";
import {
  createSimLoopState,
  normalizeSimulationConfig,
  stepFixedSimulation,
} from "@/core/simulation/fixed-step";
import {
  createDefaultLabParams,
  normalizeLabControlValue,
} from "../lib/presentation";
import type {
  ChartSpec,
  ControlSpec,
  LabModel,
  MetricValue,
  ModelMeta,
  ValidationResult,
} from "../types";

type RuntimeModel = LabModel<Record<string, number>, unknown>;

export type LabSnapshot = {
  metrics: MetricValue[];
  charts: ChartSpec[];
  validation: ValidationResult | null;
  runtime: LabRuntimeStats;
};

export type LabRuntimeStats = {
  frames: number;
  slowFrames: number;
  maximumFrameDelta: number;
  droppedSimulationTime: number;
};

export type LabRuntimeIssue = {
  phase: "create" | "step" | "draw";
  message: string;
};

const EMPTY_RUNTIME_STATS: LabRuntimeStats = {
  frames: 0,
  slowFrames: 0,
  maximumFrameDelta: 0,
  droppedSimulationTime: 0,
};

class LabRuntimeFailure extends Error {
  constructor(
    readonly phase: LabRuntimeIssue["phase"],
    cause: unknown,
  ) {
    super(
      cause instanceof Error
        ? cause.message
        : `The laboratory ${phase} phase stopped unexpectedly.`,
    );
    this.name = "LabRuntimeFailure";
  }
}

const DEFAULT_META: ModelMeta = {
  fidelity: "qualitative",
  assumptions: ["Model assumptions are not yet documented for this lab."],
  validRange: ["Use the control ranges shown in the interface."],
  sources: [],
  notes: "Validation defaults to runtime consistency checks only.",
};

const DEFAULT_VALIDATION: ValidationResult = {
  status: "warn",
  checks: [],
  warnings: ["Model-level quantitative validation is not configured yet."],
};

function readSnapshot(
  model: RuntimeModel,
  state: unknown,
  params: Record<string, number>,
): Omit<LabSnapshot, "runtime"> {
  try {
    return {
      metrics: model.metrics(state, params),
      charts: model.charts?.(state, params) ?? [],
      validation: model.validate?.(state, params) ?? DEFAULT_VALIDATION,
    };
  } catch {
    return {
      metrics: [],
      charts: [],
      validation: {
        status: "fail",
        checks: [],
        warnings: ["The model returned an invalid result for these controls."],
      },
    };
  }
}

function captureSnapshot(
  model: RuntimeModel,
  state: unknown,
  params: Record<string, number>,
  runtime: LabRuntimeStats,
): LabSnapshot {
  return {
    ...readSnapshot(model, state, params),
    runtime: { ...runtime },
  };
}

function groupControls(controls: ControlSpec[]) {
  const groups = { basic: [] as ControlSpec[], advanced: [] as ControlSpec[] };
  for (const control of controls) {
    groups[control.group === "advanced" ? "advanced" : "basic"].push(control);
  }
  return groups;
}

export function useLabRuntime(model: RuntimeModel) {
  const animated = model.animated !== false;
  const {
    paused,
    followsSystemPreference,
    toggle,
    useSystemPreference,
  } = useAnimationPlayback();
  const defaultParams = useMemo(
    () => createDefaultLabParams(model.params),
    [model.params],
  );
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));
  const [snapshot, setSnapshot] = useState<LabSnapshot>({
    metrics: [],
    charts: [],
    validation: null,
    runtime: { ...EMPTY_RUNTIME_STATS },
  });
  const [runtimeError, setRuntimeError] = useState<LabRuntimeIssue | null>(null);
  const [restartToken, setRestartToken] = useState(0);
  const { canvasRef, width, height, dpr } = useCanvasSize({
    height: 420,
    compactHeight: 300,
  });
  const stateRef = useRef<unknown | null>(null);
  const loopStateRef = useLazyRef(createSimLoopState);
  const lastSnapshotTimeRef = useRef(0);
  const runtimeStatsRef = useRef<LabRuntimeStats>({
    ...EMPTY_RUNTIME_STATS,
  });
  const simulation = useMemo(
    () => normalizeSimulationConfig(model.simulation),
    [model.simulation],
  );
  const controls = useMemo(() => groupControls(model.params), [model.params]);
  const snapshotInterval = Math.min(
    2,
    Math.max(0.1, model.snapshotInterval ?? 0.2),
  );
  const redrawKey = useMemo(
    () => ({ params, restartToken }),
    [params, restartToken],
  );

  useEffect(() => {
    setRuntimeError(null);
    runtimeStatsRef.current = { ...EMPTY_RUNTIME_STATS };
    let state: unknown;
    try {
      state = model.create(params);
      stateRef.current = state;
      loopStateRef.current = createSimLoopState();
      lastSnapshotTimeRef.current = 0;
      setSnapshot(
        captureSnapshot(model, state, params, runtimeStatsRef.current),
      );
    } catch (cause) {
      stateRef.current = null;
      const failure = new LabRuntimeFailure("create", cause);
      setRuntimeError({ phase: failure.phase, message: failure.message });
      setSnapshot({
        metrics: [],
        charts: [],
        validation: {
          status: "fail",
          checks: [],
          warnings: ["The model could not be created with these controls."],
        },
        runtime: { ...EMPTY_RUNTIME_STATS },
      });
      return;
    }

    return () => {
      if (stateRef.current === state) stateRef.current = null;
    };
  }, [loopStateRef, model, params, restartToken]);

  useCanvasAnimation({
    canvasRef,
    width,
    height,
    dpr,
    animate: animated,
    paused: animated && paused,
    redrawKey,
    onError: (error) => {
      const failure =
        error instanceof LabRuntimeFailure
          ? error
          : new LabRuntimeFailure("draw", error);
      setRuntimeError({ phase: failure.phase, message: failure.message });
    },
    draw: (context, frame) => {
      const state = stateRef.current;
      if (!state) return;
      const runtime = runtimeStatsRef.current;
      runtime.frames += 1;
      runtime.maximumFrameDelta = Math.max(
        runtime.maximumFrameDelta,
        frame.delta,
      );
      if (frame.delta > 1 / 50) runtime.slowFrames += 1;

      if (animated) {
        let result;
        try {
          result = stepFixedSimulation(
            loopStateRef.current,
            frame.delta,
            simulation,
            (fixedDt) => model.step(state, params, fixedDt),
          );
        } catch (cause) {
          throw new LabRuntimeFailure("step", cause);
        }
        loopStateRef.current = result.state;
        runtime.droppedSimulationTime += result.droppedTime;
      }
      try {
        model.draw(context, state, params, { width, height, dpr });
      } catch (cause) {
        throw new LabRuntimeFailure("draw", cause);
      }

      if (!animated) {
        setSnapshot(captureSnapshot(model, state, params, runtime));
        return;
      }
      if (lastSnapshotTimeRef.current === 0) {
        lastSnapshotTimeRef.current = frame.now;
      } else if (
        frame.now - lastSnapshotTimeRef.current >= snapshotInterval
      ) {
        lastSnapshotTimeRef.current = frame.now;
        setSnapshot(captureSnapshot(model, state, params, runtime));
      }
    },
  });

  const updateParam = (control: ControlSpec, rawValue: number) => {
    setParams((current) => ({
      ...current,
      [control.id]: normalizeLabControlValue(
        control,
        rawValue,
        current[control.id] ?? control.default,
      ),
    }));
  };

  return {
    animated,
    canvasRef,
    controls,
    defaultParams,
    height,
    meta: model.meta ?? DEFAULT_META,
    params,
    paused: animated && paused,
    followsSystemPreference,
    reset: () => {
      setRuntimeError(null);
      setParams({ ...defaultParams });
      setRestartToken((current) => current + 1);
    },
    retry: () => {
      setRuntimeError(null);
      setRestartToken((current) => current + 1);
    },
    runtimeError,
    simulation,
    snapshot,
    togglePlayback: toggle,
    updateParam,
    useSystemPlaybackPreference: useSystemPreference,
  };
}
