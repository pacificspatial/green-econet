export function roundToTwoDecimals(num: number) {
  return num % 1 !== 0 ? Math.round(num * 100) / 100 : num;
}
