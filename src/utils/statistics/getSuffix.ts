import i18n from "@/i18n/i18n";

const currentLang = i18n.language;

export const getSuffix = (title: string): string => {
  switch (title) {
    case "area_suitable_for_rain_garden":
        return " m²"
    case "japanese_lizard_habitat_area":
    case "shiokara_dragonfly_habitat_area":
    case "white_eye_habitat_area":
      return "";
    case "minimum_average_temperature":
      return " °C";
    case "inheritance_tax_street_price":
      return currentLang==="ja"?" 円":" 円";
    default:
      return "";
  }
};