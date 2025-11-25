import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
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
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  subheading: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 15,
  },
  imageContainer: {
    flexDirection: "column",
    marginVertical: 10,
  },
  column: {
    width: "100%",
    marginBottom: 15,
  },
  image: {
    width: "100%",
    height: 250,
    marginTop: 10,
    objectFit: "contain",
  },
  bottomText: {
    textAlign: "center",
    marginTop: 15,
  },
});

const AoiPdf = ({ t, images }: { t: any; images: string[] }) => {
  return (
    <Document>
      {/* First Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{t("app.page1_heading")}</Text>

        <View style={styles.imageContainer}>
          {images[0] && (
            <View style={styles.column}>
              <Text style={styles.subheading}>{t("app.page1_subheading1")}</Text>
              <Image style={styles.image} src={images[0]} />
            </View>
          )}

          {images[1] && (
            <View style={styles.column}>
              <Text style={styles.subheading}>{t("app.page1_subheading2")}</Text>
              <Image style={styles.image} src={images[1]} />
            </View>
          )}
        </View>
      </Page>

      {/* Second Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{t("app.page2_heading")}</Text>

        <View style={styles.imageContainer}>
          {images[2] && (
            <View style={styles.column}>
              <Text style={styles.subheading}>{t("app.page2_subheading1")}</Text>
              <Image style={styles.image} src={images[2]} />
            </View>
          )}

          {images[3] && (
            <View style={styles.column}>
              <Text style={styles.subheading}>{t("app.page2_subheading2")}</Text>
              <Image style={styles.image} src={images[3]} />
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default AoiPdf;