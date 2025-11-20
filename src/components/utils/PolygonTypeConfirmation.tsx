import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  styled,
} from "@mui/material";

import React, { FC } from "react";
import { useTranslation } from "react-i18next";

const CompactDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    margin: 0,
    padding: theme.spacing(1.1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[5],
    width: "100%",
    maxWidth: "350px",
  },
}));
const CompactDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(2),
  fontSize: theme.typography.h6.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  color: theme.palette.text.primary,
  textAlign: "center",
}));

const CompactDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(1),
  color: theme.palette.text.secondary,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const CompactDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(0.7),
  justifyContent: "end",
  width: "100%",
  margin: 0,
}));
const CompactButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  minWidth: "90px",
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));
const CompactCancelButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.primary.main,
  borderColor: theme.palette.primary.main,
  minWidth: "90px",
}));

interface PolygonTypeConfirmationProps {
  dialogOpen: boolean;
  handleDialogClose: () => void;
  rainGardenType: string;
  setRainGardenType: React.Dispatch<React.SetStateAction<string>>;
  handlePolygonTypeConfirmation: (rainType: number) => void;
}

const PolygonTypeConfirmation: FC<PolygonTypeConfirmationProps> = ({
  dialogOpen,
  handleDialogClose,
  rainGardenType,
  setRainGardenType,
  handlePolygonTypeConfirmation,
}) => {
  const { t } = useTranslation();
  // Handle dropdown change for polygon type (with correct type for the event)
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    setRainGardenType(event.target.value);
  };
  return (
    <CompactDialog
      open={dialogOpen}
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          handleDialogClose();
        }
      }}
    >
      <CompactDialogTitle>{t("app.selectRGType")}</CompactDialogTitle>
      <CompactDialogContent>
        <FormControl fullWidth>
          <InputLabel sx={{ mt: 1 }} id="rain-garden-type-label">
            {t("app.RGType")}
          </InputLabel>
          <Select
            sx={{ mt: 1 }}
            labelId="rain-garden-type-label"
            id="rain-garden-type"
            value={rainGardenType}
            label={t("app.RGType")}
            onChange={handleSelectChange}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: "60%",
                  overflowY: "auto",
                },
                sx: {
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                },
              },
            }}
          >
            <MenuItem value={"1"}>{t("app.typeA")}</MenuItem>
            <MenuItem value={"2"}>{t("app.typeB")}</MenuItem>
            <MenuItem value={"3"}>{t("app.typeC")}</MenuItem>
          </Select>
        </FormControl>
      </CompactDialogContent>
      <CompactDialogActions>
        <CompactCancelButton
          variant="outlined"
          onClick={handleDialogClose}
          color="secondary"
        >
          {t("app.cancel")}
        </CompactCancelButton>
        <CompactButton
          disabled={
            rainGardenType.trim() === "" || isNaN(parseInt(rainGardenType, 10))
          }
          color="primary"
          variant="contained"
          onClick={() =>
            handlePolygonTypeConfirmation(parseInt(rainGardenType, 10))
          }
        >
          {t("app.ok")}
        </CompactButton>
      </CompactDialogActions>
    </CompactDialog>
  );
};

export default PolygonTypeConfirmation;
