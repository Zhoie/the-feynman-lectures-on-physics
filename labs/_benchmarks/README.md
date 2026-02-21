# Lab Benchmarks

This folder stores benchmark source mappings and shared validation helpers for
the nine implemented labs.

## Source policy
- Every lab must declare both formula and dataset sources in `sources.ts`.
- When a dataset is not yet curated into a stable table, mark it as `pending`
  and point the URL to this file section.
- Model metadata in each `model.ts` should reference these sources via
  `getBenchmarkSources(labId)`.

## Chapter 10 dataset schema

Chapter 10 benchmark JSON files under `ch10/` follow:

```json
{
  "id": "string",
  "source": "string",
  "sourceUrl": "https://...",
  "quantity": "string",
  "unit": "string",
  "conversion": "unit conversion / normalization note",
  "sampling": {
    "xStart": 0.0,
    "xEnd": 1.0,
    "nominalStep": 0.1,
    "window": "observation window note"
  },
  "x": [0.0],
  "y": [0.0],
  "uncertainty": [0.0]
}
```

## Pending datasets

The current implementation ships with formula-backed quantitative checks for all
nine labs and placeholders for public dataset alignment.

Pending curation tasks:
- Reduced Lennard-Jones fluid reference tables for chapter 1 section 2.
- Open evaporation/condensation/dissolution and Arrhenius datasets for chapter
  1 sections 3 and 4.
