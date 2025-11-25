import { Document, Page, StyleSheet, Font } from "@react-pdf/renderer";
import NotoSansJP from "@/assets/fonts/Noto_Sans_JP/static/NotoSansJP-Regular.ttf";

Font.register({
  family: "NotoSansJP",
  src: NotoSansJP,
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "NotoSansJP",
    border: "1pt solid #000000",
  },
});

const AoiPdf = () => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        Yet to be implemented..
      </Page>
    </Document>
  );
};

export default AoiPdf;