# Lab Benchmarks

This folder stores benchmark source mappings and shared validation helpers for
the nine implemented labs.

## Source policy
- Every lab must declare both formula and dataset sources in `sources.ts`.
- When a dataset is not yet curated into a stable table, mark it as `pending`
  and point the URL to this file section.
- Model metadata in each `model.ts` should reference these sources via
  `getBenchmarkSources(labId)`.

## Pending datasets

The current implementation ships with formula-backed quantitative checks for all
nine labs and placeholders for public dataset alignment.

Pending curation tasks:
- Collision cart force/momentum datasets for Chapter 10 labs.
- Reduced Lennard-Jones fluid reference tables for chapter 1 section 2.
- Open evaporation/condensation/dissolution and Arrhenius datasets for chapter
  1 sections 3 and 4.
