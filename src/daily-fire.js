const DAILY_FIRE = { width: 30, height: 56, fps: 30 };

const DAILY_FIRE_STOPS = [
  [0, 70, 6, 0, 0],
  [0.1, 150, 32, 4, 0.5],
  [0.26, 222, 78, 12, 0.9],
  [0.46, 250, 128, 28, 1],
  [0.7, 255, 178, 62, 1],
  [0.86, 255, 226, 140, 1],
  [1, 255, 250, 228, 1],
];

const DAILY_FIRE_PALETTE = (() => {
  const palette = new Uint8ClampedArray(256 * 4);
  for (let index = 0; index < 256; index += 1) {
    const heat = index / 255;
    let stop = 1;
    while (stop < DAILY_FIRE_STOPS.length - 1 && DAILY_FIRE_STOPS[stop][0] < heat) stop += 1;
    const [fromAt, ...from] = DAILY_FIRE_STOPS[stop - 1];
    const [toAt, ...to] = DAILY_FIRE_STOPS[stop];
    const mix = Math.min(1, Math.max(0, (heat - fromAt) / (toAt - fromAt)));
    for (let channel = 0; channel < 4; channel += 1) {
      const value = from[channel] + (to[channel] - from[channel]) * mix;
      palette[index * 4 + channel] = channel === 3 ? value * 255 : value;
    }
  }
  return palette;
})();

function dailyFireHash(x, y, z) {
  let hash = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0;
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295;
}

function dailyFireNoise(x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const ease = (value) => value * value * (3 - 2 * value);
  const sx = ease(x - ix);
  const sy = ease(y - iy);
  const sz = ease(z - iz);
  const mix = (from, to, share) => from + (to - from) * share;
  const sheet = (zz) => mix(
    mix(dailyFireHash(ix, iy, zz), dailyFireHash(ix + 1, iy, zz), sx),
    mix(dailyFireHash(ix, iy + 1, zz), dailyFireHash(ix + 1, iy + 1, zz), sx),
    sy,
  );
  return mix(sheet(iz), sheet(iz + 1), sz);
}

function dailyFireFbm(x, y, z) {
  return dailyFireNoise(x, y, z) * 0.55 + dailyFireNoise(x * 2.03, y * 2.03, z * 2.03) * 0.3 + dailyFireNoise(x * 4.1, y * 4.1, z * 4.1) * 0.15;
}

function dailyFireSway(v, t, seed = 0) {
  return (dailyFireFbm(v * 1.4 + seed, t * 0.9, seed) - 0.5) * 0.8 * v * v;
}

function dailyFireHeat(u, v, t, seed = 0, sway = dailyFireSway(v, t, seed)) {
  const ease = Math.min(1, Math.max(0, v / 0.22));
  const width = 0.86 * Math.pow(Math.max(0, 1 - v), 0.95) * (0.5 + 0.5 * ease * (2 - ease)) + 0.02;
  const shape = 1 - Math.abs(u - sway) / width;
  const base = Math.min(1, Math.max(0, (v + 0.02) / 0.1));
  const body = shape * (1.2 - 0.45 * v) - 0.12 * v;
  if (base <= 0 || body + 0.93 * v <= 0) return 0;
  const lick = (dailyFireFbm(u * 4.6 + seed, v * 3.4 - t * 3.6, t * 0.9 + seed) - 0.5) * 2;
  return (body - v * (0.12 + 1.05 * lick)) * base;
}

function dailyFirePaint(data, width, height, t, seed = 0) {
  for (let y = 0; y < height; y += 1) {
    const v = (1 - (y + 0.5) / height) * 1.14 - 0.04;
    const sway = dailyFireSway(v, t, seed);
    for (let x = 0; x < width; x += 1) {
      const u = ((x + 0.5) / width) * 2 - 1;
      const heat = Math.min(1, Math.max(0, dailyFireHeat(u, v, t, seed, sway)));
      const at = (y * width + x) * 4;
      const tone = Math.round(heat * 255) * 4;
      data[at] = DAILY_FIRE_PALETTE[tone];
      data[at + 1] = DAILY_FIRE_PALETTE[tone + 1];
      data[at + 2] = DAILY_FIRE_PALETTE[tone + 2];
      data[at + 3] = DAILY_FIRE_PALETTE[tone + 3];
    }
  }
  return data;
}

if (typeof module !== 'undefined') module.exports = { DAILY_FIRE, dailyFireHeat, dailyFirePaint };
