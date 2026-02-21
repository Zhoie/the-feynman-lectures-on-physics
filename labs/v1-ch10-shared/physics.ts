export const G = 9.81;

export type Body1D = {
  x: number;
  v: number;
  m: number;
  halfSize: number;
};

export type ResistanceConfig = {
  rollingMu: number;
  viscousCoeff: number;
  slopeDeg: number;
};

export type TrackConfig = {
  left: number;
  right: number;
  wallRestitution: number;
  bufferDamping: number;
};

export type ForcePulse = {
  start: number;
  duration: number;
  amplitude: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function slopeRadians(config: ResistanceConfig): number {
  return (config.slopeDeg * Math.PI) / 180;
}

export function rollingResistanceForce(body: Body1D, config: ResistanceConfig) {
  const speed = Math.abs(body.v);
  if (speed < 1e-4) return 0;
  const slope = slopeRadians(config);
  return -Math.sign(body.v) * config.rollingMu * body.m * G * Math.cos(slope);
}

export function viscousForce(body: Body1D, config: ResistanceConfig) {
  return -config.viscousCoeff * body.v;
}

export function slopeForce(body: Body1D, config: ResistanceConfig) {
  const slope = slopeRadians(config);
  return body.m * G * Math.sin(slope);
}

export function externalPulseForce(time: number, pulse: ForcePulse): number {
  const t0 = pulse.start;
  const t1 = pulse.start + pulse.duration;
  if (time < t0 || time > t1 || pulse.duration <= 0) {
    return 0;
  }
  return pulse.amplitude;
}

export function pulseFromImpulse(
  start: number,
  duration: number,
  impulse: number
): ForcePulse {
  const safeDuration = Math.max(1e-6, duration);
  return {
    start,
    duration: safeDuration,
    amplitude: impulse / safeDuration,
  };
}

export function velocityDependentRestitution(
  relativeSpeed: number,
  baseRestitution: number,
  slope: number,
  minRestitution = 0.1,
  maxRestitution = 1
) {
  return clamp(
    baseRestitution - Math.max(0, relativeSpeed) * Math.max(0, slope),
    minRestitution,
    maxRestitution
  );
}

export function integrateBody(body: Body1D, force: number, dt: number) {
  const a = force / Math.max(1e-9, body.m);
  body.v += a * dt;
  body.x += body.v * dt;
}

export function resolveBodyCollision(
  leftBody: Body1D,
  rightBody: Body1D,
  restitution: number
) {
  const dx = rightBody.x - leftBody.x;
  const minGap = leftBody.halfSize + rightBody.halfSize;
  const overlap = minGap - Math.abs(dx);
  if (overlap <= 0) {
    return false;
  }

  const sign = dx === 0 ? 1 : Math.sign(dx);
  leftBody.x -= (overlap * 0.5) * sign;
  rightBody.x += (overlap * 0.5) * sign;

  const relV = rightBody.v - leftBody.v;
  const closing = dx * relV < 0;
  if (!closing) {
    return false;
  }

  const m1 = leftBody.m;
  const m2 = rightBody.m;
  const e = clamp(restitution, 0, 1);
  const v1 = leftBody.v;
  const v2 = rightBody.v;

  leftBody.v =
    ((m1 - e * m2) / (m1 + m2)) * v1 + ((1 + e) * m2) / (m1 + m2) * v2;
  rightBody.v =
    ((m2 - e * m1) / (m1 + m2)) * v2 + ((1 + e) * m1) / (m1 + m2) * v1;
  return true;
}

export function applyRelativeEnergyLoss(
  leftBody: Body1D,
  rightBody: Body1D,
  lossFraction: number
) {
  const f = clamp(lossFraction, 0, 0.95);
  if (f <= 0) return;
  const scale = Math.sqrt(1 - f);
  const m1 = leftBody.m;
  const m2 = rightBody.m;
  const vCom = (m1 * leftBody.v + m2 * rightBody.v) / Math.max(1e-9, m1 + m2);
  leftBody.v = vCom + (leftBody.v - vCom) * scale;
  rightBody.v = vCom + (rightBody.v - vCom) * scale;
}

export function resolveWallContact(body: Body1D, track: TrackConfig) {
  const e = clamp(track.wallRestitution, 0, 1);
  if (body.x - body.halfSize < track.left) {
    const penetration = track.left - (body.x - body.halfSize);
    body.x = track.left + body.halfSize;
    body.v = Math.abs(body.v) * e - penetration * track.bufferDamping;
    return true;
  }
  if (body.x + body.halfSize > track.right) {
    const penetration = body.x + body.halfSize - track.right;
    body.x = track.right - body.halfSize;
    body.v = -Math.abs(body.v) * e + penetration * track.bufferDamping;
    return true;
  }
  return false;
}

export function momentum(bodyA: Body1D, bodyB: Body1D) {
  return bodyA.m * bodyA.v + bodyB.m * bodyB.v;
}

export function kineticEnergy(bodyA: Body1D, bodyB: Body1D) {
  return 0.5 * bodyA.m * bodyA.v * bodyA.v + 0.5 * bodyB.m * bodyB.v * bodyB.v;
}
