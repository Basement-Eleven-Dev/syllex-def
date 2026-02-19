import pdf from "pdf-parse";
import mammoth from "mammoth";
import * as xlsx from "xlsx";
import { extractWithGeminiVision } from "../AI/exctractWithGeminiVision";

export async function extractTextFromFile(
  buffer: Buffer,
  extension: string,
): Promise<string> {
  const ext = extension.toLowerCase().replace(".", "");

  try {
    if (ext === "pdf") {
      const data = await pdf(buffer);
      // Se il PDF ha poco testo (scansione), usa Gemini
      const hasActualText = /[a-z0-9]/i.test(data.text);

      if (!hasActualText || data.text.trim().length < 100) {
        if (buffer.byteLength > 20 * 1024 * 1024) {
          throw new Error("File troppo grande per l'analisi vision (max 20MB)");
        }
        console.log("PDF sembra una scansione. Uso Gemini...");
        return await extractWithGeminiVision(buffer, "application/pdf");
      }

      return data.text;
    } else if (ext === "docx" || ext === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
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
