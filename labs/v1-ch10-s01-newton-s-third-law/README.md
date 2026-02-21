# Action and Reaction with Sensor Reality (SI)

Two carts are linked by a spring-damper pair in SI units. The model keeps the
physical truth `F12 = -F21`, then passes each channel through sensor sampling,
low-pass smoothing, offset, and noise.

## What you can do
- Change **cart 2 mass** and **initial spring stretch**.
- Tune **spring damping**.
- In **Advanced**, tune sensor Hz, smoothing, offset, and noise.

## What to notice
- True force balance stays near zero.
- Measured force balance is not perfectly zero because instruments are imperfect.
- The normalized measured residual and dataset sigma gate define pass/fail.
