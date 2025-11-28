import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import resultServices from "../services/resultServices.js"
import projectService from "../services/projectService.js";
import fs from "fs";
import path from "path";
import { renderMapImage, rowsToGeoJSON } from "../utils/mapUtils.js";
export const createExcelFile = async ({
  projectName,
  valueBA,
  valueA,
  valueB,
}) => {
  // Create a new Excel workbook
  const workbook = new ExcelJS.Workbook();

  // Add a worksheet to the workbook
  const sheet = workbook.addWorksheet("Sheet1");

  sheet.getColumn(1).width = 45; // Column A
  sheet.getColumn(2).width = 20; // Column B
  sheet.getColumn(3).width = 20; // Column C
  sheet.getColumn(4).width = 20; // Column D

  /**
   * -------------------------
   * Row 1 — Title Header
   * -------------------------
   * Merge A1–B1 for the title block
   * Apply bold & larger text
   */
  sheet.mergeCells("A1:B1");
  const r1 = sheet.getCell("A1");
  r1.value = "生態系ネットワーク状況の指標値算出";
  r1.font = { bold: true, size: 14 };
  r1.alignment = { vertical: "middle", horizontal: "left" };

  /**
   * -------------------------
   * Row 2 — Project Name
   * -------------------------
   * Merge A2–B2 and show the value of the project name
   */
  sheet.mergeCells("A2:B2");
  sheet.getCell("A2").value = projectName;

  /**
   * -------------------------
   * Row 3 — Value B - A
   * -------------------------
   */
  sheet.getCell("A3").value = "指標値の増加(B-A)";
  addVal(sheet.getCell("B3"), valueBA);

  /**
   * -------------------------
   * Row 4 — Value A
   * -------------------------
   */
  sheet.getCell("A4").value = "①緑地を追加する以前の指標値";
  addVal(sheet.getCell("B4"), valueA);

  /**
   * -------------------------
   * Row 5 — Value B
   * -------------------------
   */
  sheet.getCell("A5").value = "②緑地を追加した場合の指標値";
  addVal(sheet.getCell("B5"), valueB);

  /**
   * Local helper for setting output values
   * Ensures uniform text alignment for all value cells
   */
  function addVal(cell, val) {
    cell.value = val;
    cell.alignment = { horizontal: "left", vertical: "middle" };
  }

  // Convert workbook to a buffer and return it
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export const createPdfFile = async (projectId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const project = await projectService.getProject(projectId);
      const clippedBuffer125 = await resultServices.getClippedBuffer125GreenResult(projectId);
      const clippedGreen = await resultServices.getClippedGreenResult(projectId);
      const mergedBuffer125 = await resultServices.getMergedBuffer125GreenResult(projectId);
      const mergedGreen = await resultServices.getMergedGreenResult(projectId);
      
      // Create separate GeoJSON for each layer type
      const clippedBuffer125GeoJSON = rowsToGeoJSON(clippedBuffer125, 'clipped-buffer-125-green');
      const clippedGreenGeoJSON = rowsToGeoJSON(clippedGreen, 'clipped-green');
      const projectGeoJSON = rowsToGeoJSON([project], 'project-boundary');
      const mergedBuffer125Geojson = rowsToGeoJSON(mergedBuffer125, 'merged-buffer125-green')
      const mergedGreenGeojson = rowsToGeoJSON(mergedGreen, 'merged-green');

      // Render map image with separate layers
      const snapshotImage = await renderMapImage(
        clippedBuffer125GeoJSON,
        clippedGreenGeoJSON,
        projectGeoJSON
      );

      const snapshotImage2 = await renderMapImage(
        mergedBuffer125Geojson,
        mergedGreenGeojson,
        projectGeoJSON
      );

      const projectName = project.name;
      const valueA = project.valuea || 0;
      const valueB = project.valueb || 0;
      const valueBA = project.valueba || 0;

      // Initialize PDF first
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 30, bottom: 30, left: 30, right: 30 }
      });
      
      doc.registerFont(
        "JP-Regular",
        path.join(process.cwd(), "assets/fonts/NotoSansJP-Regular.ttf")
      );      
      // --- Draw page border inside margins ---
      doc.rect(
        doc.page.margins.left,
        doc.page.margins.top,
        doc.page.width - doc.page.margins.left - doc.page.margins.right,
        doc.page.height - doc.page.margins.top - doc.page.margins.bottom
      ).stroke();

      const PADDING_LEFT = doc.page.margins.left + 10;
      const PADDING_TOP = doc.page.margins.top + 10;

      // Set starting cursor with padding
      doc.x = PADDING_LEFT;
      doc.y = PADDING_TOP;

      // ---- SAVE TO LOCAL FILE ----
      const outputPath = `/Users/sayandak/Desktop/Tekgile/econet_plateau/server/project_${projectId}.pdf`;
      const fileStream = fs.createWriteStream(outputPath);
      doc.pipe(fileStream);

      // ---- BUFFER FOR API RESPONSE ----
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // -------------------------------
      // TITLE
      // -------------------------------
      doc.fontSize(16)
        .font("JP-Regular")
        .text("生態系ネットワーク状況の指標値算出", {
          align: "left",
          indent: 10
        });
      doc.moveDown(1.2);

      // -------------------------------
      // PROJECT NAME
      // -------------------------------
      doc.fontSize(12)
        .font("JP-Regular")
        .text(`（プロジェクト名）: ${projectName}`, { indent: 10 });
      doc.moveDown(1.5);

      // -------------------------------
      // B-A VALUE
      // -------------------------------
      doc.font("JP-Regular")
        .fontSize(13)
        .text(`指標値の増加: ${valueBA}`, { indent: 10 });

      doc.moveTo(40, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown(1.5);

      doc.font("JP-Regular")
        .fontSize(11)
        .text(
          "指標値の増加＝Ｂ（緑地を追加した場合の指標値）― Ａ（緑地を追加する以前の指標値）",
          { indent: 10 }
        );
      doc.moveDown(2);

      // -------------------------------
      // A VALUE
      // -------------------------------
      doc.font("JP-Regular")
        .fontSize(12)
        .text(`【A】緑地を追加する以前の指標値： ${valueA}`, { indent: 10 });

      doc.moveTo(40, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown(2);

      doc.image(snapshotImage, {
        fit: [500, 200],
        align: "center",
      });
      doc.moveDown(2);

      // -------------------------------
      // B VALUE
      // -------------------------------
      doc.font("JP-Regular")
        .fontSize(12)
        .text(`【B】緑地を追加した場合の指標値： ${valueB}`, { indent: 10 });

      doc.moveTo(40, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown(2);

      doc.image(snapshotImage2, {
        fit: [500, 200],
        align: "center",
      });
      doc.moveDown(2);

      // Finish writing
      doc.end();

    } catch (err) {
      reject(err);
    }
  });
};