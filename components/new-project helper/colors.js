export const basicColors = [
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#00FF00',
  '#1f9d7fff',
  '#00FFFF',
  '#0000FF',
  '#8B00FF',
  '#FFC0CB',
  '#A52A2A',
  '#808080',
  '#000000'
];


export const lightenColor = (color, percent = 40) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
};

export const isValidColor = (color) => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

export const getValidColor = (color) => {
  if (!color) return '#ccc';
  let finalColor = color.startsWith('#') ? color : '#' + color;
  return isValidColor(finalColor) ? finalColor : '#ccc';
};