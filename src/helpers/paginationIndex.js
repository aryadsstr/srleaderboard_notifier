function getIndexWithPart(mode, index) {
  const upper = mode.toUpperCase();

  if (upper.includes('P3')) return index + 200;
  if (upper.includes('P2')) return index + 100;

  return index;
}

module.exports = {
  getIndexWithPart
};