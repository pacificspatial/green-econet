export const formatValue = (value: number, title: string): string => {
  // const multiplyBy100Titles = [
  //     "japanese_lizard_habitat_area",
  //     "shiokara_dragonfly_habitat_area",
  //     "white_eye_habitat_area"
  // ];

  // Multiply ecological metrics by 100
  // if (multiplyBy100Titles.includes(title)) {
  //     const multipliedValue = value;
  //     return multipliedValue.toLocaleString();
  // }

  // Ensure 3-digit separators for rain garden & street price
  if (title === "area_suitable_for_rain_garden") {
    return value.toLocaleString("en-US");
  }
  if (title === "inheritance_tax_street_price") {
    return Math.round(value).toLocaleString();
  }

  // Ensure integer values have a separator
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(2);
};
