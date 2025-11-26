import { Popover, List, ListItemButton, ListItemText, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (type: "pdf" | "csv") => void;
}

const DownloadPopover = ({ anchorEl, onClose, onSelect }: Props) => {
  const { t } = useTranslation();

  const handlePdf = () => {
    onClose();      
    // handle pdf logic here
  };

  return (
    <>
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

            <ListItemButton onClick={() => onSelect("csv")}>
              <ListItemText primary={t("app.csv")} />
            </ListItemButton>
          </List>
        </Box>
      </Popover>

    </>
  );
};

export default DownloadPopover;
