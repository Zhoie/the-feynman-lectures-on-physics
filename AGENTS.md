# Section Labs Plan (Precision, Non-Repeat)

## Goal
Build **one interactive lab per section** (not just per chapter) across all
volumes. Each lab must be **content-aligned**, **non-repeating**, mobile-safe,
and testable. Chapter 1–6 labs follow the detailed specs provided by the user.

## Constraints
- **Every section** in `manifest.json` has a lab directory with:
  `spec.yaml`, `model.ts`, `view.ts`, `README.md`, `tests.spec.ts`.
- Labs must be **interactive**, **visual**, and **measurable** (metrics + tests).
- **No duplicate experiments** across sections.
- **Mobile-first**: touch controls, responsive canvas, stable FPS.
- **English UI** for all labs.
- Avoid copying PDF text; use only short titles and paraphrase.

## Deliverables
- `manifest.json` with **all sections** across Vol. I–III.
- Lab framework + archetypes + registry.
- Chapter 1–6 labs implemented **exactly** per provided specs.
- All remaining sections covered with **unique** experiments.
- Homepage filters (volume/chapter, archetype, search).
- Progress overview page showing **100% complete**.
- `npm test` passes; `npm run dev` works.

## Phases
### Phase 1 — Manifest & Registry
1. Build `manifest.json` by crawling section headings (via r.jina.ai).
2. Validate: every section has a unique `labId`.
3. Generate lab registry + type-safe helpers.

### Phase 2 — Lab Framework
1. Core lab runtime: canvas, animation loop, controls, metrics panel.
2. Archetype system (shared engines + charting utilities).
3. Vitest setup + base test helpers.

### Phase 3 — Chapter 1–6 (Spec-Exact)
Implement **all 31 section labs** exactly as specified:
data fitting, LJ phases, evaporation, reaction coordinate, CA vs rules,
force comparison, double-slit visibility, conservation checker, etc.

### Phase 4 — Remaining Sections (All Volumes)
1. Assign each section an archetype based on content keywords.
2. Generate spec + model + view + tests per section.
3. Manual review for accuracy + uniqueness.

### Phase 5 — UI & QA
1. Lab index page with filters + search.
2. Overview progress page (100%).
3. Mobile pass + performance pass.
4. Run `npm test` + spot-check labs.

## Progress Tracking
- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Phase 4 complete
- [ ] Phase 5 complete

## Notes
- Accuracy > speed. If a section topic is unclear, pause and verify.
- Use Planck.js only for rigid-body cases that need it.
- Keep simulations deterministic where possible for testing.
