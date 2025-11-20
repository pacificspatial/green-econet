import { formatValue } from "@/utils/statistics/formatValue";
import { getSuffix } from "@/utils/statistics/getSuffix";
import { Box, styled, Typography } from "@mui/material";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

interface AOIStatsDataProps {
  title: string;
  value: number;
  count?: number;
}

const getTranslationKey = (apiKey: string) => {
  const mappings: Record<string, string> = {
    count: "count",
    area_suitable_for_rain_garden: "rainGardenPotentialArea",
    inheritance_tax_street_price: "aoiStatsStreetPriceLabel",
    japanese_lizard_habitat_area: "aoiStatsLizardLabel",
    minimum_average_temperature: "aoiStatsTemperatureLabel",
    shiokara_dragonfly_habitat_area: "aoiStatsDragonflyLabel",
    white_eye_habitat_area: "aoiStatsWhiteEyeLabel",
  };
  return mappings[apiKey] || apiKey;
};

const isEcologicalMetric = (title: string) => {
  return [
    "japanese_lizard_habitat_area",
    "shiokara_dragonfly_habitat_area",
    "white_eye_habitat_area",
  ].includes(title);
};

const isTemperatureOrStreetPriceMetric = (title: string) => {
  return [
    "minimum_average_temperature",
    "inheritance_tax_street_price",
  ].includes(title);
};
const isHeatReliefEffect = (title: string) => {
  return ["minimum_average_temperature"].includes(title);
};
const isRealEstateValue = (title: string) => {
  return ["inheritance_tax_street_price"].includes(title);
};
const AOIStatsData: FC<AOIStatsDataProps> = ({ title, value, count }) => {
  const { t } = useTranslation();
  const suffix = getSuffix(title);
  const formattedValue = formatValue(value, title);
  const translationKey = getTranslationKey(title);

  if (title === "count") return;

  if (isEcologicalMetric(title)) {
    return (
      <Box mb={1} padding={1} paddingLeft={5}>
        <ul style={{ margin: 0 }}>
          <li>
            <StyledTypography>
              {t(`app.${translationKey}`)}: {formattedValue}
              {suffix}
            </StyledTypography>
          </li>
        </ul>
      </Box>
    );
  }

  return (
    <Box mb={1} padding={1} paddingLeft={3}>
      <StyledTypography variant="subtitle1" fontWeight={510} gutterBottom>
        {t(`app.${translationKey}`)}
      </StyledTypography>
      <ul style={{ margin: 0, paddingLeft: "40px" }}>
        <li>
          <StyledTypography>
            {formattedValue}
            {suffix} {count ? `(${count?.toLocaleString()} グリッド)` : ""}
          </StyledTypography>
        </li>
      </ul>
    </Box>
  );
};

// Wrapper component to handle the grouping
const AOIStatsDataWrapper: FC<{
  items: Array<{ title: string; value: number }>;
}> = ({ items }) => {
  const { t } = useTranslation();

  const aoiCountValue = items[0].value;

  const installationEffectsItems = items.filter((item) =>
    isTemperatureOrStreetPriceMetric(item.title)
  );
  const ecologicalItems = items.filter((item) =>
    isEcologicalMetric(item.title)
  );
  const otherItems = items.filter(
    (item) =>
      !isEcologicalMetric(item.title) &&
      !isTemperatureOrStreetPriceMetric(item.title)
  );
  const heatReliefEffectItems = installationEffectsItems.filter((item) =>
    isHeatReliefEffect(item.title)
  );
  const realEstateValueItems = installationEffectsItems.filter((item) =>
    isRealEstateValue(item.title)
  );

  return (
    <>
      {/* General Metrics */}
      {otherItems.map((item, index) => {
        // Check if the item is 'area_suitable_for_rain_garden'
        if (item.title === "area_suitable_for_rain_garden") {
          return (
            <AOIStatsData
              key={index}
              title={item.title}
              value={item.value}
              count={aoiCountValue}
            />
          );
        }
        return (
          <AOIStatsData key={index} title={item.title} value={item.value} />
        );
      })}

      {/* Combined Section: Effects Associated with Installation */}
      {installationEffectsItems.length > 0 && (
        <Box padding={0} paddingLeft={0}>
          {heatReliefEffectItems.length > 0 && (
            <Box padding={0} paddingLeft={0}>
              {heatReliefEffectItems.map((item, index) => (
                <AOIStatsData
                  key={index}
                  title={item.title}
                  value={item.value}
                />
              ))}
            </Box>
          )}
          {realEstateValueItems.length > 0 && (
            <Box padding={1} paddingLeft={3}>
              <StyledTypography variant="subtitle1" fontWeight={510}>
                {t("app.realEstateValueLabel")}
              </StyledTypography>
              {realEstateValueItems.map((item, index) => (
                <AOIStatsData
                  key={index}
                  title={item.title}
                  value={item.value}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Ecological Habitat Metrics (With More Left Padding) */}
      {ecologicalItems.length > 0 && (
        <Box padding={1} paddingLeft={3}>
          <StyledTypography variant="subtitle1" fontWeight={510}>
            {t("app.aoiStatsHabitatLabel")}
          </StyledTypography>
          {ecologicalItems.map((item, index) => (
            <AOIStatsData key={index} title={item.title} value={item.value} />
          ))}
        </Box>
      )}
    </>
  );
};

export default AOIStatsDataWrapper;
