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
      valueBA: project.indexba,
      valueA: project.indexa,
      valueB: project.indexb,
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
    throw error;
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
    throw error;
  }
}

export async function exportsServices(projectId) {
  try {
    const results = {};
    results["xlsx"] = await handleExcelExport(projectId);
    results["pdf"] = await handlePDFExport(projectId);

    return results;
  } catch (error) {
    console.error("Error in exportsServices", error);
    throw error;
  }
}
