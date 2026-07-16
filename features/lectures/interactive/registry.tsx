import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { moduleTypes, type ModuleType } from "./types";

type ModuleComponent = ComponentType<{ params: Record<string, number> }>;
type ModuleLoader = () => Promise<{ default: ModuleComponent }>;

function LoadingModule() {
  return (
    <div
      className="grid h-[250px] place-items-center rounded-2xl border border-slate-900/10 bg-white/60 text-sm text-slate-600 sm:h-[320px]"
      role="status"
    >
      Preparing experiment…
    </div>
  );
}

const moduleLoaders = {
  "field-motion": () =>
    import("./modules/field-motion").then((module) => ({
      default: module.FieldMotionModule,
    })),
  "wave-interference": () =>
    import("./modules/wave-interference").then((module) => ({
      default: module.WaveInterferenceModule,
    })),
  "vector-field": () =>
    import("./modules/vector-field").then((module) => ({
      default: module.VectorFieldModule,
    })),
  "rigid-body": () =>
    import("./modules/rigid-body").then((module) => ({
      default: module.RigidBodyModule,
    })),
  "random-walk": () =>
    import("./modules/random-walk").then((module) => ({
      default: module.RandomWalkModule,
    })),
  "phase-exchange": () =>
    import("./modules/phase-exchange").then((module) => ({
      default: module.PhaseExchangeModule,
    })),
  "reaction-coordinate": () =>
    import("./modules/reaction-coordinate").then((module) => ({
      default: module.ReactionCoordinateModule,
    })),
  "phase-space": () =>
    import("./modules/phase-space").then((module) => ({
      default: module.PhaseSpaceModule,
    })),
  "circuit-response": () =>
    import("./modules/circuit-response").then((module) => ({
      default: module.CircuitResponseModule,
    })),
  "quantum-amplitude": () =>
    import("./modules/quantum-amplitude").then((module) => ({
      default: module.QuantumAmplitudeModule,
    })),
  spacetime: () =>
    import("./modules/spacetime").then((module) => ({
      default: module.SpacetimeModule,
    })),
} satisfies Record<ModuleType, ModuleLoader>;

export const moduleRegistry = Object.fromEntries(
  moduleTypes.map((moduleType) => [
    moduleType,
    dynamic(moduleLoaders[moduleType], {
      loading: LoadingModule,
      ssr: false,
    }),
  ]),
) as Record<ModuleType, ModuleComponent>;

const animatedModules: ReadonlySet<ModuleType> = new Set([
  "field-motion",
  "wave-interference",
  "rigid-body",
  "random-walk",
  "phase-exchange",
  "reaction-coordinate",
  "phase-space",
]);

export function isAnimatedModule(moduleType: ModuleType) {
  return animatedModules.has(moduleType);
}

export function preloadModule(moduleType: ModuleType) {
  return moduleLoaders[moduleType]();
}
