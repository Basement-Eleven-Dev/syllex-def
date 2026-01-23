import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import {
  AWS_REGION,
  GCP_PROJECT_NUMBER,
  GCP_PROCESSOR_ID,
} from "../config/env";
import { getSecret } from "../getDatabase";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import { PDFDocument } from "pdf-lib";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { parseStringPromise } from "xml2js";

const s3Client = new S3Client({ region: AWS_REGION });
let documentAiClient: DocumentProcessorServiceClient | null = null;
const DOCUMENT_AI_MIMETYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "image/jpeg", // .jpeg, .jpg
  "image/png", // .png
  "image/tiff", // .tiff, .tif
  "image/gif", // .gif
];

/**
 * Recupera e parsa le credenziali di Google Cloud da AWS Secrets Manager.
 * La funzione è "pigra": esegue l'operazione solo una volta e mette in cache il risultato.
 */
const getGcpCredentials = async () => {
  console.log("[File Utils] Tentativo di recupero credenziali GCP...");
  const secretString = await getSecret("gcp_syllex");

  if (!secretString) {
    throw new Error("Segreto 'gpp_syllex' non trovato in AWS Secrets Manager.");
  }
  try {
    const credentials = JSON.parse(secretString);
    console.log(
      "[File Utils] Credenziali GCP recuperate e parsate con successo."
    );
    return credentials;
  } catch (error) {
    console.error(
      "[File Utils] Errore nel parsing delle credenziali GCP JSON.",
      error
    );
    throw new Error("Le credenziali GCP nel segreto non sono un JSON valido.");
  }
};

/**
 * Estrae il testo da un file PPTX parsando manualmente il XML interno.
 * I file PPTX sono archivi ZIP contenenti XML con il contenuto.
 */
async function extractTextFromPPTX(fileBuffer: Buffer): Promise<string> {
  console.log("[File Utils] Estrazione testo da PPTX con JSZip...");

  try {
    const zip = await JSZip.loadAsync(fileBuffer);
    let fullText = "";

    // I file PPTX contengono le slide in ppt/slides/slideX.xml
    const slideFiles = Object.keys(zip.files).filter(
      (fileName) =>
        fileName.startsWith("ppt/slides/slide") && fileName.endsWith(".xml")
    );

    console.log(`[File Utils] Trovate ${slideFiles.length} slide nel PPTX`);

    // Ordina le slide per numero
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0");
      return numA - numB;
    });

    // Estrai il testo da ogni slide
    for (const slideFile of slideFiles) {
      const slideNumber = slideFile.match(/slide(\d+)\.xml/)?.[1] || "?";
      const slideXml = await zip.file(slideFile)?.async("text");

      if (slideXml) {
        const slideText = await extractTextFromSlideXml(slideXml);
        if (slideText.trim()) {
          fullText += `\n--- Slide ${slideNumber} ---\n${slideText}\n`;
        }
      }
    }

    // Estrai anche le note delle slide se presenti
    const notesFiles = Object.keys(zip.files).filter(
      (fileName) =>
        fileName.startsWith("ppt/notesSlides/notesSlide") &&
        fileName.endsWith(".xml")
    );

    if (notesFiles.length > 0) {
      console.log(`[File Utils] Trovate ${notesFiles.length} note nel PPTX`);

      for (const notesFile of notesFiles) {
        const notesXml = await zip.file(notesFile)?.async("text");
        if (notesXml) {
          const notesText = await extractTextFromSlideXml(notesXml);
          if (notesText.trim()) {
            fullText += `\n[Note]: ${notesText}\n`;
          }
        }
      }
    }

    console.log(
      `[File Utils] Estrazione PPTX completata. Lunghezza: ${fullText.length}`
    );
    return fullText.trim();
  } catch (error) {
    console.error("[File Utils] Errore nell'estrazione PPTX:", error);
    throw new Error("Impossibile estrarre il testo dal file PPTX");
  }
}

/**
 * Estrae il testo da una singola slide XML.
 * Il testo si trova nei tag <a:t> dentro <p:txBody>
 */
async function extractTextFromSlideXml(xmlContent: string): Promise<string> {
  try {
    const result = await parseStringPromise(xmlContent, {
      explicitArray: false,
      ignoreAttrs: true,
    });

    const textElements: string[] = [];

    // Funzione ricorsiva per trovare tutti i tag <a:t>
    function findTextNodes(obj: any): void {
      if (!obj) return;

      if (typeof obj === "object") {
        // Se troviamo un nodo di testo (a:t), lo aggiungiamo
        if (obj["a:t"]) {
          const text = obj["a:t"];
          if (typeof text === "string" && text.trim()) {
            textElements.push(text.trim());
          }
        }

        // Continua la ricerca ricorsiva
        for (const key in obj) {
          findTextNodes(obj[key]);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item) => findTextNodes(item));
      }
    }

    findTextNodes(result);

    return textElements.join(" ");
  } catch (error) {
    console.warn("[File Utils] Errore nel parsing XML della slide:", error);
    return "";
  }
}

/**
 * Inizializza il client di Document AI in modo "pigro" (lazy),
 * solo quando è strettamente necessario.
 */
const getDocumentAiClient =
  async (): Promise<DocumentProcessorServiceClient> => {
    if (!documentAiClient) {
      console.log(
        "[File Utils] Inizializzazione del client Google Document AI..."
      );
      const credentials = await getGcpCredentials();
      const clientOptions = {
        credentials,
        apiEndpoint: "eu-documentai.googleapis.com",
      };

      documentAiClient = new DocumentProcessorServiceClient(clientOptions);
      console.log(
        "[File Utils] Client Google Document AI inizializzato sull'endpoint corretto."
      );
    }
    return documentAiClient;
  };

/**
 * Converte uno stream di dati da S3 in un Buffer.
 */
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Funzione principale che orchestra l'estrazione del testo.
 * Implementa una strategia a cascata: prova prima un parser veloce e gratuito,
 * e solo se fallisce, passa a un motore OCR avanzato.
 */
export async function extractTextFromS3File(
  bucket: string,
  key: string,
  mimetype: string
): Promise<string> {
  console.log(`[File Utils] Avvio estrazione per il file: ${key}`);

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const { Body } = await s3Client.send(command);
  if (!Body) throw new Error("Corpo del file vuoto ricevuto da S3.");
  const fileBuffer = await streamToBuffer(Body as NodeJS.ReadableStream);

  // Caso 1: Documento Word
  if (mimetype.includes("wordprocessingml")) {
    console.log("[File Utils] Rilevato documento Word. Uso Mammoth...");
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }
  //pptx
  if (mimetype.includes("presentationml.presentation")) {
    console.log(
      "[File Utils] Rilevato file PPTX. Uso estrattore personalizzato..."
    );
    return await extractTextFromPPTX(fileBuffer);
  }

  //excel
  if (
    mimetype.includes("spreadsheetml.sheet") || // .xlsx
    mimetype.includes("ms-excel") // .xls
  ) {
    console.log("[File Utils] Rilevato file Excel. Uso la libreria 'xlsx'...");
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    let fullText = "";
    // Itera su ogni foglio del file Excel
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      // Converte il contenuto del foglio in un formato di testo semplice (CSV)
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      // Aggiunge un'intestazione per separare i fogli nel testo finale
      fullText += `--- Contenuto Foglio: ${sheetName} ---\n${csvText}\n\n`;
    });
    return fullText;
  }

  // Caso 2: File complessi (PDF, Immagini, PPTX)
  if (DOCUMENT_AI_MIMETYPES.includes(mimetype)) {
    // Tentativo #1 (solo per PDF): L'estrattore veloce e gratuito
    if (mimetype === "application/pdf") {
      try {
        console.log(
          "[File Utils] Tentativo #1 per PDF: Estrattore veloce (pdf-parse)..."
        );
        const data = await pdf(fileBuffer);
        const text = data.text?.trim() || "";
        if (text.length > 100) {
          console.log(
            `[File Utils] Successo con l'estrattore veloce. Lunghezza testo: ${text.length}`
          );
          return text;
        }
        console.log(
          "[File Utils] L'estrattore veloce ha prodotto testo insufficiente."
        );
      } catch (error) {
        console.warn("[File Utils] L'estrattore veloce è fallito.", error);
      }
    }

    // Piano B (per tutti i file complessi): Motore OCR avanzato
    console.log(
      `[File Utils] Passo al motore OCR avanzato (Google Document AI) per ${mimetype}...`
    );
    return await extractWithDocumentAI(fileBuffer, mimetype);
  }

  // Caso 3 (Fallback): File di testo semplice
  console.log(
    "[File Utils] Rilevato file di testo. Eseguo conversione diretta."
  );
  return fileBuffer.toString("utf8");
}

/**
 * Esegue l'analisi con Google Document AI, dividendo il PDF in blocchi se necessario.
 */
async function extractWithDocumentAI(
  fileBuffer: Buffer,
  mimetype: string
): Promise<string> {
  const pageLimit = 15; // Limite di pagine per chiamata sincrona a Document AI

  try {
    // Per i PDF, controlliamo e dividiamo se necessario
    if (mimetype === "application/pdf") {
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pageCount = pdfDoc.getPageCount();

      if (pageCount > pageLimit) {
        console.log(
          `[Document AI] Il PDF ha ${pageCount} pagine. Avvio divisione in blocchi.`
        );
        let fullText = "";
        for (let i = 0; i < pageCount; i += pageLimit) {
          const endIndex = Math.min(i + pageLimit, pageCount);
          console.log(
            `[Document AI] Processo il blocco di pagine da ${
              i + 1
            } a ${endIndex}...`
          );

          const subDoc = await PDFDocument.create();
          const pageIndices = Array.from(
            { length: endIndex - i },
            (_, k) => i + k
          );
          const copiedPages = await subDoc.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((page) => subDoc.addPage(page));

          const subDocBytes = await subDoc.save();
          const subDocBuffer = Buffer.from(subDocBytes);

          const chunkText = await processDocumentAIChunk(
            subDocBuffer,
            mimetype
          );
          fullText += chunkText + "\n\n";
        }
        return fullText;
      }
    }

    // Per immagini, PPTX e PDF piccoli, processiamo in un colpo solo
    return await processDocumentAIChunk(fileBuffer, mimetype);
  } catch (error) {
    console.error("[Document AI] Errore critico:", error);
    throw new Error("L'analisi avanzata del documento (OCR) è fallita.");
  }
}

/**
 * Funzione helper che invia un singolo blocco (Buffer) a Google Document AI.
 */
async function processDocumentAIChunk(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  const client = await getDocumentAiClient();
  if (!GCP_PROJECT_NUMBER || !GCP_PROCESSOR_ID) {
    throw new Error(
      "Credenziali o ID del processore Google Cloud non configurati."
    );
  }
  const name = `projects/${GCP_PROJECT_NUMBER}/locations/eu/processors/${GCP_PROCESSOR_ID}`;

  const [result] = await client.processDocument({
    name,
    rawDocument: { content: buffer, mimeType: mimetype },
  });

  return result.document?.text || "";
}
