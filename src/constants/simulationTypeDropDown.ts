import { TFunction } from "i18next"

export type DrawType = 'polygon' | 'line' | 'point';

export interface RainGardenOption {
    label: string;
    value: number;
    supportedDrawTypes: DrawType[];
    subOptions?: RainGardenOption[];
}

export const getSimulationTypeDropDown = (t: TFunction): RainGardenOption[] => {
  const typeE = {
    label: t("app.typeE"),
    value: 5,
    supportedDrawTypes: ["point"] as DrawType[],
  };

  const typeF = {
    label: t("app.typeF"),
    value: 6,
    supportedDrawTypes: ["point"] as DrawType[],
  };

  return [
    {
      label: t("app.typeA"),
      value: 1,
      supportedDrawTypes: ["polygon", "line"],
    },
    {
      label: t("app.typeB"),
      value: 2,
      supportedDrawTypes: ["polygon", "line"],
    },
    {
      label: t("app.typeC"),
      value: 3,
      supportedDrawTypes: ["polygon", "line"],
    },
    {
      label: t("app.typeD"),
      value: 4,
      supportedDrawTypes: ["polygon"],
    },
    typeE,
    typeF,
    {
      label: t("app.typeG"),
      value: 7,
      supportedDrawTypes: ["line"],
      subOptions: [typeE, typeF],
    },
  ];
};


export const getOptionsForDrawType = (
    options: RainGardenOption[], 
    drawType: DrawType
): RainGardenOption[] => {
    return options.filter(option => 
        option.supportedDrawTypes.includes(drawType)
    );
}