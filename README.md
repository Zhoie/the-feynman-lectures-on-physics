# The Feynman Lectures on Physics Labs

Interactive labs for *The Feynman Lectures on Physics*, built with Next.js, React 19, and a quantitative lab runtime.

This repository is not a generic lecture site anymore. It now contains a live lab system with:

- manifest-backed lab ids and stable `/lab/[labId]` routes
- fixed-step simulation support for frame-rate-independent results
- model metadata for assumptions, valid ranges, and source tracking
- benchmark overlays, tolerances, and hard validation gates
- per-lab functional tests plus calibration tests

## Current live coverage

The manifest currently describes `693` lecture sections across all three volumes, but only registry-backed labs are live. Right now the registry exposes `28` labs:

- Volume 1, Chapter 1: `4` labs
- Volume 1, Chapter 10: `5` labs
- Chapter 12 across Volumes 1-3: `19` labs

Chapter 12 is fully shipped in this repo:

- Volume 1 Chapter 12: `6` labs
- Volume 2 Chapter 12: `7` labs
- Volume 3 Chapter 12: `6` labs

If a section exists in `manifest.json` but is not registered in `features/labs/registry.ts`, its `/lab/[labId]` route will intentionally return `404`.

## Quantitative lab standard

The current lab contract is defined in `features/labs/types.ts`. A quantitative lab is expected to provide:

- `simulation`: fixed-step runtime configuration
- `meta`: fidelity, assumptions, valid range, and source metadata
- `validate()`: hard numeric checks returning `ok`, `warn`, or `fail`
- metrics with `reference`, `tolerance`, and `status`
- charts with simulation/reference roles and optional uncertainty bands

Benchmarks live under `labs/_benchmarks/`. The current policy is:

- formula baselines are required for launch
- public dataset baselines may remain `pending`
- pending datasets must still be declared in source metadata

## Project structure

```text
app/lab/[labId]/page.tsx              Dynamic lab route
features/labs/manifest.ts             Manifest access helpers
features/labs/registry.ts             Live lab loaders
features/labs/types.ts                Shared lab model contract
features/labs/ui/lab-shell.tsx        Common lab UI shell
features/labs/core/sim-loop.ts        Fixed-step simulation loop
labs/_benchmarks/                     Benchmark profiles and source metadata
labs/v1-ch10-shared/                  Shared Chapter 10 physics helpers
labs/v1-ch12-shared/                  Shared Volume 1 Chapter 12 mechanics helpers
labs/v2-ch12-shared/                  Shared Volume 2 Chapter 12 continuum helpers
labs/v3-ch12-shared/                  Shared Volume 3 Chapter 12 quantum helpers
labs/<labId>/                         Per-lab model, view, docs, and tests
```

Each live lab directory should contain:

- `model.ts`
- `view.ts`
- `README.md`
- `spec.yaml`
- `tests.spec.ts`
- `calibration.spec.ts`

## Local development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Then open any live lab route, for example:

```text
http://localhost:3000/lab/v1-ch12-s01-what-is-a-force
http://localhost:3000/lab/v2-ch12-s03-the-stretched-membrane
http://localhost:3000/lab/v3-ch12-s04-the-zeeman-splitting
```

## Tests

Run the full test suite with:

```bash
npm test
```

The suite covers:

- shared-core numerical behavior
- per-lab functional behavior
- per-lab calibration thresholds
- global calibration threshold gates
- registry completeness for Chapter 12 labs

## Adding or upgrading a lab

1. Create `labs/<labId>/` with `model.ts`, `view.ts`, `README.md`, `spec.yaml`, `tests.spec.ts`, and `calibration.spec.ts`.
2. Implement the model against `features/labs/types.ts`.
3. Add benchmark profile data under `labs/_benchmarks/` and source metadata in `labs/_benchmarks/sources.ts`.
4. Register the view in `features/labs/registry.ts`.
5. Add or update global threshold coverage in `labs/calibration-thresholds.spec.ts`.

The current direction of the project is explicit: new labs should land as quantitative teaching tools, not trend-only demos.
