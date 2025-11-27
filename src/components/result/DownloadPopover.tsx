import { Popover, List, ListItemButton, ListItemText, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (type: "pdf" | "xlsx") => void;
}

const DownloadPopover = ({ anchorEl, onClose, onSelect }: Props) => {
  const { t } = useTranslation();

  const handlePdf = () => {
    onSelect("pdf");
  };

  const handleCsv = () => {
    onSelect("xlsx");
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <Box sx={{ minWidth: 160 }}>
        <List>
          <ListItemButton onClick={handlePdf}>
            <ListItemText primary={t("app.pdf")} />
          </ListItemButton>

          <ListItemButton onClick={handleCsv}>
            <ListItemText primary={t("app.xlsx")} />
          </ListItemButton>
        </List>
      </Box>
    </Popover>
  );
};

export default DownloadPopover;