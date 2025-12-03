export const formatValue = (value: number): string => {
  // Ensure integer values have a separator
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(2);
};
