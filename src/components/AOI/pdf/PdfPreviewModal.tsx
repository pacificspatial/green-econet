import { Modal, Box, CircularProgress, Typography } from "@mui/material";
import { PDFViewer } from "@react-pdf/renderer";
import AoiPdf from "./AoiPdf";
import { useEffect, useState } from "react";
import { downloadImagesToPdf } from "@/utils/pdf/downloadImagesToPdf";
import { sampleFeatureCollections } from "@/constants/dummyCollections";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PdfPreviewModal = ({ open, onClose }: Props) => {
  const { t } = useTranslation();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    downloadImagesToPdf({
      shapes: sampleFeatureCollections,
      mapOptions: {
        center: [0.5, 0.5],
        zoom: 15,
        //Change basemap when its implemented
        basemap: "mapbox://styles/mapbox/streets-v11",
        highResolution: false,
      },
    })
      .then((imgs) => setImages(imgs))
      .finally(() => setLoading(false));
  }, [open]);  

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
        {loading ? (
          <>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>{t("app.pdfLoading")}</Typography>
          </>
        ) : (
          <PDFViewer style={{ width: "100%", height: "100%" }}>
            <AoiPdf t={t} images={images} />
          </PDFViewer>
        )}
      </Box>
    </Modal>
  );
};

export default PdfPreviewModal;
