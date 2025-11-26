import ExcelJS from "exceljs";
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
