const themes = {
  day: {
    ink: '#15282b', muted: '#465355', surface: '#f3e8cf', raised: '#fff8e9', primary: '#276f7a', soft: '#acd2cb', sacred: '#1f4d74', danger: '#8f3528',
  },
  duat: {
    ink: '#f5e7c6', muted: '#b8b59f', surface: '#11242c', raised: '#19313a', primary: '#72c4bd', soft: '#285852', sacred: '#84add4', danger: '#f09280',
  },
};

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((value) => parseInt(value, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const failures = [];
for (const [name, color] of Object.entries(themes)) {
  const pairs = [
    ['body', color.ink, color.surface],
    ['body raised', color.ink, color.raised],
    ['muted', color.muted, color.surface],
    ['primary action', name === 'day' ? color.raised : color.raised, color.primary],
    ['soft action', name === 'day' ? color.ink : color.ink, color.soft],
    ['sacred label', color.sacred, color.raised],
    ['danger label', color.danger, color.raised],
  ];
  for (const [label, foreground, background] of pairs) {
    const ratio = contrast(foreground, background);
    const pass = ratio >= 4.5;
    console.log(`${pass ? 'PASS' : 'FAIL'} ${name.padEnd(4)} ${label.padEnd(16)} ${ratio.toFixed(2)}:1`);
    if (!pass) failures.push(`${name} ${label}`);
  }
}

if (failures.length) {
  console.error(`\nContrast failures: ${failures.join(', ')}`);
  process.exit(1);
}
