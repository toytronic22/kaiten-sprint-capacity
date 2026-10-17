const test = require('node:test');
const assert = require('node:assert/strict');
const { DAILY_FIRE, dailyFireHeat, dailyFirePaint } = require('../src/daily-fire.js');

const TIMES = [0, 0.4, 1.3, 2.7, 5.1, 9.9];
const paint = (t) => dailyFirePaint(new Uint8ClampedArray(DAILY_FIRE.width * DAILY_FIRE.height * 4), DAILY_FIRE.width, DAILY_FIRE.height, t, 0);
const alpha = (data, x, y) => data[(y * DAILY_FIRE.width + x) * 4 + 3];

test('Огонь факела: у основания по центру горячо, сбоку и над пламенем пусто — в любой момент', () => {
  // Arrange
  const spots = TIMES.map((t) => ({ core: dailyFireHeat(0, 0.15, t), side: dailyFireHeat(0.97, 0.15, t), above: dailyFireHeat(0, 1.05, t) }));

  // Act
  const coolest = Math.min(...spots.map((spot) => spot.core));

  // Assert
  assert.ok(coolest > 0.6, String(coolest));
  assert.ok(spots.every((spot) => spot.side <= 0 && spot.above <= 0));
});

test('Огонь факела: кадр прозрачен по углам, а языки пламени меняются во времени', () => {
  // Arrange
  const corners = [[0, 0], [DAILY_FIRE.width - 1, 0], [0, DAILY_FIRE.height - 1], [DAILY_FIRE.width - 1, DAILY_FIRE.height - 1]];

  // Act
  const frames = TIMES.map(paint);
  const shapes = new Set(frames.map((data) => Array.from({ length: DAILY_FIRE.width * DAILY_FIRE.height }, (_, at) => (data[at * 4 + 3] > 100 ? 1 : 0)).join('')));

  // Assert
  for (const data of frames) for (const [x, y] of corners) assert.equal(alpha(data, x, y), 0, `${x},${y}`);
  assert.equal(shapes.size, TIMES.length);
});
