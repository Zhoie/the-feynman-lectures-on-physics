# Isolated Collision Track with Finite Forcing (SI)

Two carts move on an explicit track with bumpers. External forcing is modeled as
a finite pulse, and dissipation channels (rolling resistance, slope, viscous)
can be enabled to mimic real lab tracks.

## What you can do
- Change **masses**, **initial velocities**, and **restitution**.
- Apply a finite **pulse force** for a finite **duration**.
- In **Advanced**, add rolling resistance, slope, and viscous drag.

## What to notice
- In isolated mode, normalized momentum drift should stay below 1%.
- With forcing/loss terms enabled, conservation gate is intentionally relaxed.
- Dataset residual tracks how close the drift trajectory is to benchmark runs.
