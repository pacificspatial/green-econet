import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
  Grid,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { SimulationDetailsResponse, TYPE_KEYS, TypeLetter } from "@/types/SimulationManualData";

interface SimulationInfoPopupProps {
  open: boolean;
  onClose: () => void;
  onRunSimulation: () => void;
  simulationDetails: SimulationDetailsResponse | null;
}

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 0",
  textAlign: "center",
};

const formatNumber = (value: number) => {
  if (value === null || value === undefined || isNaN(Number(value))) return "0";

  return new Intl.NumberFormat("ja-JP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
};


const renderRow = (
  label: string,
  cost?: number,
  volume?: number,
  bold: boolean = false,
  noDivider: boolean = false
) => (
  <>
    <Box sx={rowStyle}>
      <Box sx={{ width: "33%", textAlign: "left", pl: 2 }}>
        <Typography sx={{ fontWeight: bold ? 700 : 400 }}>
          {label}
        </Typography>
      </Box>

      <Box sx={{ width: "33%", textAlign: "right" }}>
        <Typography>
          {formatNumber(cost || 0)} yen
        </Typography>
      </Box>

      <Box sx={{ width: "33%", textAlign: "right" }}>
        <Typography>
          {formatNumber(volume || 0)} m³
        </Typography>
      </Box>
    </Box>
    {!noDivider && <Divider sx={{ my: 2 }} />}
  </>
);

const SimulationInfoPopup: React.FC<SimulationInfoPopupProps> = ({
  open,
  onClose,
  onRunSimulation,
  simulationDetails,
}) => {
  const { t } = useTranslation();

  if (!simulationDetails) return null;

  const getCost = (type: TypeLetter, details: SimulationDetailsResponse) => {
  const key = TYPE_KEYS[type];
  return details.cost[`type_${key}_cost` as const];
};

const getVolume = (type: TypeLetter, details: SimulationDetailsResponse) => {
  const key = TYPE_KEYS[type];
  return details.volume[`type_${key}_volume` as const];
};


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent dividers sx={{ px: 6, py: 4 }}>
        {/* TOP SUMMARY SECTION */}
        <Box>
          {[
            {
              label: t("simulationDetails.targetArea"),
              value: `${formatNumber(simulationDetails.aoi_area)} m²`,
            },
            {
              label: t("simulationDetails.underfloorFloodRisk"),
              value: `${formatNumber(simulationDetails.inundationVolume.underfloor_flooding)} m³`,
            },
            {
              label: t("simulationDetails.totalFloodRisk"),
              value: `${formatNumber(simulationDetails.inundationVolume.total_inundation)} m³`,
            },
            {
              label: t("simulationDetails.outflowPreventionMeasure"),
              value: `${formatNumber(simulationDetails.runoffControl.runoffControlVolume)} m³`,
            },
            {
              label: t("simulationDetails.amountOfReduction1"),
              value: `${formatNumber(
                simulationDetails.runoffControl.floodRiskReductionDepth0To0_5
              )} m³`,
            },
            {
              label: t("simulationDetails.amountOfReduction2"),
              value: `${formatNumber(
                simulationDetails.runoffControl.floodRiskReductionDepth0_5To3_0
              )} m`,
            },
            {
              label: t("simulationDetails.outflowPrevention"),
              value: `${formatNumber(
                simulationDetails.runoffControl.runoffSuppressionEffect
              )} %`,
            },
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              <Box sx={rowStyle}>
                <Typography>{item.label}</Typography>
                <Typography>{item.value}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
            </React.Fragment>
          ))}
        </Box>

        {/* COST & EFFECT TABLE HEADER */}
        <Box sx={{ mb: 2 }}>
          <Grid container sx={{ mb: 1 }}>
            <Grid item xs={4}></Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontWeight: 600, textAlign: "left" }}>
                {t("simulationDetails.costOfOutflowPrevention")}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontWeight: 600, textAlign: "left" }}>
                {t("simulationDetails.effectOfOutFlowPrevention")}
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />

          {/* Raingarden (A, B, C) */}
          <Typography sx={{ fontWeight: 600, mt: 1 }}>
            {t("simulationDetails.raingarden")}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {["A", "B", "C"].map((type) => (
            renderRow(
              t(`app.type${type}`),
              getCost(type as TypeLetter, simulationDetails),
              getVolume(type as TypeLetter, simulationDetails)
            )
          ))}

          {/* Rainwater infiltration (E, F) */}
          <Typography sx={{ fontWeight: 600, mt: 1 }}>
            {t("simulationDetails.rainWaterInfiltration")}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {["E", "F"].map((type) => (
            renderRow(
              t(`app.type${type}`),
              getCost(type as TypeLetter, simulationDetails),
              getVolume(type as TypeLetter, simulationDetails)
            )
          ))}

          {/* Infiltration trench G */}
          {renderRow(
            t("simulationDetails.infiltrationTrench"),
            simulationDetails.cost.type_g_cost,
            simulationDetails.volume.type_g_volume,
            true
          )}

          {/* Permeable pavement D */}
          {renderRow(
            t("simulationDetails.permeablePavement"),
            simulationDetails.cost.type_d_cost,
            simulationDetails.volume.type_d_volume,
            true
          )}

          {/* Sum */}
          {renderRow(
            t("simulationDetails.sum"),
            simulationDetails.cost.total_cost,
            simulationDetails.volume.total_volume,
            true,
            true
          )}
        </Box>
      </DialogContent>

      {/* ACTION BUTTONS */}
      <DialogActions sx={{ flexDirection: "column", gap: 1, pt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            onRunSimulation();
            onClose();
          }}
        >
          {t("app.runSimulation")}
        </Button>
        <Button onClick={onClose}>{t("app.cancel")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SimulationInfoPopup;
