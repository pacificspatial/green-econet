import { uploadToExportBucket } from "./s3Services.js";
import { createExcelFile } from "../helpers/createExportFiles.js";


async function handleExcelExport(projectId) {
  const buffer = await createExcelFile({
    projectName: "Your Project Name",
    valueBA: 0,
    valueA: 0,
    valueB: 0,
  });

  const fileName = `${projectId}_excel.xlsx`;

  //upload to s3
  const url = await uploadToExportBucket(
    buffer,
    fileName,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xlsx"
  );

  return { fileName, url };
}

export async function handleExports(projectId) {
  const results = {};
  results["xlsx"] = await handleExcelExport(projectId);

  return results;
}
