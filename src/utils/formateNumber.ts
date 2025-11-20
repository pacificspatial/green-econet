export const formatNumber = (num: number) => {
  const suffixes = ["", "K", "M", "B", "T", "Q", "Qa", "Sx", "Sp"];
  const tier = Math.floor(Math.log10(num) / 3);

  if (tier === 0) return num.toString();

  const scaled = num / Math.pow(10, tier * 3);
  return scaled.toPrecision(3) + suffixes[tier];
};
