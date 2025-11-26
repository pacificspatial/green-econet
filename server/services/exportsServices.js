import { uploadToExportBucket } from "./s3Services.js";
import {
  createExcelFile,
  createPdfFile,
} from "../helpers/createExportFiles.js";
import projectService from "../services/projectService.js";

async function handleExcelExport(projectId) {
  try {
    const project = await projectService.getProject(projectId);
    const buffer = await createExcelFile({
      projectName: project.name,
      valueBA: 0,
      valueA: 0,
      valueB: 0,
    });

    const fileName = `${projectId}_excel.xlsx`;

    //upload to s3
    const { key } = await uploadToExportBucket(
      buffer,
      fileName,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "xlsx"
    );

    return { key };
  } catch (error) {
    console.error("Error while creating excel", error);
  }
}

async function handlePDFExport(projectId) {
  try {
    const buffer = await createPdfFile(projectId);
    const fileName = `${projectId}_pdf.pdf`;

    //upload to s3
    const { key } = await uploadToExportBucket(
      buffer,
      fileName,
      "application/pdf",
      "pdf"
    );

    return { key };
  } catch (error) {
    console.error("Error while creating pdf", error);
  }
}

export async function handleExports(projectId) {
  const results = {};
  results["xlsx"] = await handleExcelExport(projectId);
  results["pdf"] = await handlePDFExport(projectId);

  return results;
}
