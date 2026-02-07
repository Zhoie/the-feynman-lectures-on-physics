import type { ComponentType } from "react";
import type { ModuleType } from "./types";
import { FieldMotionModule } from "./modules/field-motion";
import { WaveInterferenceModule } from "./modules/wave-interference";
import { VectorFieldModule } from "./modules/vector-field";
import { RigidBodyModule } from "./modules/rigid-body";
import { RandomWalkModule } from "./modules/random-walk";
import { PhaseSpaceModule } from "./modules/phase-space";
import { CircuitResponseModule } from "./modules/circuit-response";
import { QuantumAmplitudeModule } from "./modules/quantum-amplitude";
import { SpacetimeModule } from "./modules/spacetime";

type ModuleComponent = ComponentType<{ params: Record<string, number> }>;

export const moduleRegistry: Record<ModuleType, ModuleComponent> = {
  "field-motion": FieldMotionModule,
  "wave-interference": WaveInterferenceModule,
  "vector-field": VectorFieldModule,
  "rigid-body": RigidBodyModule,
  "random-walk": RandomWalkModule,
  "phase-space": PhaseSpaceModule,
  "circuit-response": CircuitResponseModule,
  "quantum-amplitude": QuantumAmplitudeModule,
  "spacetime": SpacetimeModule,
};
