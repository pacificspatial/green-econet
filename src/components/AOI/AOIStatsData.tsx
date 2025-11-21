import { formatValue } from "@/utils/statistics/formatValue";
import { getSuffix } from "@/utils/statistics/getSuffix";
import { Box, styled, Typography } from "@mui/material";
import React from "react";

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

interface AOIStatsDataProps {
  title: string;
  value: number;
  count?: number;
}

const AOIStatsData: React.FC<AOIStatsDataProps> = ({ title, value, count }) => {
  const suffix = getSuffix(title);
  const formattedValue = formatValue(value);

  return (
    <Box mb={1} padding={1} paddingLeft={3}>
      <StyledTypography variant="subtitle1" fontWeight={510} gutterBottom>
        {title}
      </StyledTypography>
      <ul style={{ margin: 0, paddingLeft: "40px" }}>
        <li>
          <StyledTypography>
            {formattedValue}
            {suffix} {count ? `(${count?.toLocaleString()})` : ""}
          </StyledTypography>
        </li>
      </ul>
    </Box>
  );
};

const AOIStatsDataWrapper: React.FC<{
  items: Array<{ title: string; value: number }>;
}> = ({ items }) => {
  return (
    <>
      {/* General Metrics */}
      {items.map((item, index) => (
        <AOIStatsData key={index} title={item.title} value={item.value} />
      ))}
    </>
  );
};

export default AOIStatsDataWrapper;
