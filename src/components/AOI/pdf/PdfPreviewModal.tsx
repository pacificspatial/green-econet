import { Modal, Box, CircularProgress, Typography } from "@mui/material";
import { PDFViewer } from "@react-pdf/renderer";
import AoiPdf from "./AoiPdf";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PdfPreviewModal = ({ open, onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90vw",
          height: "90vh",
          bgcolor: "background.paper",
          boxShadow: 24,
          outline: "none",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {true ? (
          <>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>{t("app.pdfLoading")}</Typography>
          </>
        ) : (
          <PDFViewer style={{ width: "100%", height: "100%" }}>
            <AoiPdf />
          </PDFViewer>
        )}
      </Box>
    </Modal>
  );
};

export default PdfPreviewModal;
