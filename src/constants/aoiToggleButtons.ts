import { UsageType } from "@/types/UsageType";
import { TFunction } from "i18next";

export const getAoiToggleButtons = (t: TFunction, savedAoiType: number | null | undefined, usageType: UsageType | null) => [
  {
    value: "polygon",
    label: t("app.polygon"),
    isSaved: savedAoiType === 1,
    isDisabled: false
  },
  {
    value: "region",
    label: t("app.region"),
    isSaved: savedAoiType === 2,
    isDisabled: usageType && usageType.value === "road_planning" ? true : false
  }
];
