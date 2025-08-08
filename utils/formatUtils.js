// /utils/formatUtils.js
export function formatPartyName(name) {
  if (!name || name === 'N/A') return 'N/A';
  const parts = name.split(' ');
  return parts[0].length <= 3 ? name.substring(0, 3) : parts[0];
}
