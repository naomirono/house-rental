export const normPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('254')) return d;
  if (d.startsWith('0')) return '254' + d.slice(1);
  if (d.length === 9) return '254' + d;
  return d;
};
