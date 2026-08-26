// The ONLY source of pseudo-randomness in the app, and it is seeded + deterministic.
// Used only at authoring time for non-load-bearing jitter — never for anything a verdict
// depends on. No Math.random(), Date.now(), or new Date() anywhere in src/.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED = 0x51a7c0de; // fixed
export const rng = mulberry32(SEED); // deterministic stream
