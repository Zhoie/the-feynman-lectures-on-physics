# Experiment Correctness, Performance, and Interface Design

## Scope

Improve both experiment systems without replacing the existing content:

- chapter-embedded interactive experiments
- quantitative laboratory pages
- shared typography and experiment interface styling

Preserve all existing uncommitted work, experiment coverage, routes, and
scientific source metadata.

## Current Evidence

The existing 147 tests, lint, and production build pass, but they do not cover
several user-facing defects:

- chapter random walks and rigid-body simulations advance once per rendered
  frame, making outcomes depend on display refresh speed
- laboratory reset restarts the current state without restoring default
  control values
- embedded control changes request an unchanged server route on every slider
  movement
- every chapter bundles all experiment modules, including the physics engine,
  before the selected experiment is known
- continuous canvases keep running while their page is hidden
- the reaction-coordinate plot and displayed crossing likelihood use
  inconsistent activation barriers
- three font families and many explicit weights produce 23 font files totaling
  about 324 kilobytes
- small uppercase labels and dense three-column laboratory layouts reduce
  readability

## Chosen Approach

Use a focused, shared-runtime repair instead of a visual-only pass or complete
engine rewrite. The work will correct simulation timing and model invariants,
load only the active chapter module, simplify state updates, and redesign the
existing experiment surfaces around a consistent scholarly interface.

## Runtime and Data Flow

Create shared canvas lifecycle helpers that:

- clamp pixel density to a useful maximum
- advance changing simulations with elapsed time rather than rendered frames
- use bounded fixed updates for physics simulations
- stop scheduling frames while the document is hidden
- avoid resize state updates when dimensions have not changed

Chapter experiment selection updates local state immediately and changes the
URL only when the selected experiment changes. Slider movement and reset stay
local and never trigger navigation. The selected module loads on demand behind
a stable loading state.

Laboratory animation remains canvas-driven. React-visible metrics, charts, and
validation results update as one snapshot at a lower sampling rate. Reset
restores model defaults and recreates the simulation exactly once.

## Scientific and Logical Correctness

Correct the embedded models at their shared boundaries:

- random-walk displacement scales with elapsed time and uses deterministic
  seeded noise for reproducible tests
- rigid-body stepping uses the existing bounded fixed-step runtime
- reaction-coordinate activation energy is derived from the plotted potential;
  catalysts lower the transition barrier without changing endpoint energies
- temperature increases crossing likelihood monotonically
- phase-exchange labels describe relative rates, not unsupported physical
  percentages
- control values are finite and clamped to declared ranges
- chart paths ignore invalid points and always use finite domains

Embedded teaching models remain explicitly qualitative. Quantitative laboratory
models retain their existing validation metadata and benchmark comparisons.

## Typography and Interface

Replace the current three-family font payload with two variable families:

- Source Serif 4 for lecture and experiment headings
- Source Sans 3 for reading text, controls, labels, and numbers

Use the system monospace stack only where fixed-width numeric alignment is
needed. Reduce extreme letter spacing, raise the smallest text size, and use
sentence case for explanatory labels.

Recompose the experiment surfaces:

- make the canvas the clear primary workspace
- keep controls adjacent and comfortably touchable
- show key metrics in a concise row beneath the workspace
- move assumptions, valid ranges, checks, and sources into an accessible
  details section
- keep charts full-width and responsive
- use one restrained ink, paper, sky, amber, and emerald palette
- provide visible focus states and useful canvas descriptions

The layout stacks in task order on small screens: experiment, controls,
results, charts, then model details.

## Error Handling

Invalid control input falls back to the declared default. Non-finite metrics
and chart points render as unavailable instead of producing broken geometry.
Missing experiment modules show a stable error message without breaking the
chapter. Animation cleanup always cancels pending frames.

## Verification

Add focused tests for:

- equivalent simulation results across different render schedules
- deterministic random-walk behavior
- reaction-rate monotonicity and catalyst invariants
- parameter normalization and true reset behavior
- finite chart-domain and metric formatting behavior
- experiment registry loading and route-selection rules

Run the complete test suite, lint, and production build. Compare production
font bytes and the selected chapter experiment chunk against the recorded
baseline. Inspect the final diff to ensure user-owned changes remain intact.
