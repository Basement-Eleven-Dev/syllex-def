import pdf from "pdf-parse";
import mammoth from "mammoth";
import * as xlsx from "xlsx";
import { extractPDFWithGoogleDocumentAI } from "../AI/exctractWithGeminiVision";
import officeParser from "officeparser";

export async function extractTextFromFile(
  buffer: Buffer,
  extension: string,
): Promise<string> {
  console.log(
    `Starting text extraction for file with extension: .${extension}`,
  );
  let ext = extension.toLowerCase().replace(".", "");
  if (
    ext ===
    "application/vndopenxmlformats-officedocument.wordprocessingml.document"
  ) {
    ext = "docx";
  } else if (ext === "application/msword") {
    ext = "doc";
  } else if (ext === "application/pdf") {
    ext = "pdf";
  } else if (ext.includes("spreadsheetml") || ext.includes("excel")) {
    ext = "xlsx";
  } else if (ext === "pptx") {
    return await extractTextFromPptx(buffer);
  }

  console.log(`Extracting text from file with extension: .${ext}`);
  try {
    if (ext === "pdf") {
      const data = await pdf(buffer);
      const hasActualText = /[a-z0-9]/i.test(data.text);

      if (!hasActualText || data.text.trim().length < 100) {
        if (buffer.byteLength > 20 * 1024 * 1024) {
          throw new Error("File troppo grande per l'analisi vision (max 20MB)");
        }
        console.log("PDF sembra una scansione. Uso Gemini...");
        return await extractPDFWithGoogleDocumentAI(buffer);
      }

      return data.text;
    } else if (ext === "docx" || ext === "doc") {
      console.log("Estrazione testo da Word con mammoth...");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (
      ext === "jpeg" ||
      ext === "jpg" ||
      ext === "png" ||
      ext === "tiff"
    ) {
      console.log("Estrazione testo da immagini con OCR...");
      return await extractPDFWithGoogleDocumentAI(buffer);
    } else if (ext === "xlsx" || ext === "xls") {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      let text = "";
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        text += xlsx.utils.sheet_to_txt(sheet) + "\n";
      });
      return text;
    } else {
      // Assume text-based formats (txt, md, csv, json, etc.)
      return buffer.toString("utf-8");
    }
  } catch (error) {
    console.error(`Error extracting text from .${ext} file:`, error);
    throw new Error(`Failed to extract text from .${ext} file.`);
  }
}
export async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    officeParser.parseOffice(buffer, (data: unknown, err: any) => {
      if (err) return reject(err);

      if (typeof data === "string") {
        return resolve(data.trim());
      }

      if (data && typeof data === "object") {
        const text = extractTextFromOfficeAst(data).replace(/\s+/g, " ").trim();
        return resolve(text);
      }

      return resolve(String(data ?? ""));
    });
  });
}

function extractTextFromOfficeAst(node: any, acc: string[] = []): string {
  if (!node) return acc.join(" ");

  if (typeof node === "string") {
    acc.push(node);
  } else if (Array.isArray(node)) {
    node.forEach((n) => extractTextFromOfficeAst(n, acc));
  } else if (typeof node === "object") {
    if (typeof node.text === "string") acc.push(node.text);
    if (node.content) extractTextFromOfficeAst(node.content, acc);
    if (node.children) extractTextFromOfficeAst(node.children, acc);
  }

  return acc.join(" ");
}
