import { TFunction } from "i18next";

export const getHeaderToggleButtons = (t: TFunction) => [
  { value: "aoi", label: t("app.aoiLabel"), isDisabled: false },
  { value: "simulation", label: t("app.simulationLabel"), isDisabled: false },
  { value: "result", label: t("app.resultLabel"), isDisabled: false },
];
