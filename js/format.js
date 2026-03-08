// format.js - Number formatting utilities

const FORMAT_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];

function formatNumber(num) {
  if (num < 1000) {
    if (num < 1 && num > 0) return num.toFixed(1);
    return Math.floor(num).toString();
  }

  let tier = 0;
  let scaled = num;
  while (scaled >= 1000 && tier < FORMAT_SUFFIXES.length - 1) {
    scaled /= 1000;
    tier++;
  }

  if (scaled >= 100) return Math.floor(scaled) + FORMAT_SUFFIXES[tier];
  if (scaled >= 10) return scaled.toFixed(1) + FORMAT_SUFFIXES[tier];
  return scaled.toFixed(2) + FORMAT_SUFFIXES[tier];
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
