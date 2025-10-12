export const basicColors = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#1f9d7fff',// Dark Green
  '#00FFFF', // Cyan
  '#0000FF', // Blue
  '#8B00FF', // Violet / Purple
  '#FFC0CB', // Pink
  '#A52A2A', // Brown
  '#808080', // Gray
  '#000000' // Black
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