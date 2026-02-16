import pdf from "pdf-parse";
import mammoth from "mammoth";
import * as xlsx from "xlsx";


export async function extractTextFromFile(
  buffer: Buffer,
  extension: string,
): Promise<string> {
  const ext = extension.toLowerCase().replace(".", "");

  try {
    if (ext === "pdf") {
      const data = await pdf(buffer);
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