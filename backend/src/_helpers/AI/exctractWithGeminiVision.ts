import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSecret } from "../secrets/getSecret";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { GCP_PROCESSOR_ID, GCP_PROJECT_NUMBER } from "../../env";
import { PDFDocument } from 'pdf-lib';


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
const getDocumentAiClient = async (): Promise<DocumentProcessorServiceClient> => {
  const credentials = await getGcpCredentials();
  const clientOptions = {
    credentials,
    apiEndpoint: "eu-documentai.googleapis.com",
  };
  return new DocumentProcessorServiceClient(clientOptions);
};

//DOES NOT WORK
const extractWithGeminiVision = async (
  buffer: Buffer,
  mimeType: string,
): Promise<string> => {
  try {
    const gemini_api_key = await getSecret("gemini_api_key");
    if (!gemini_api_key) throw new Error("API Key mancante");

    const genAI = new GoogleGenerativeAI(gemini_api_key);

    // Prova con il nome esatto "gemini-1.5-flash"
    // Se fallisce, prova "gemini-1.5-flash-latest"
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const base64Data = buffer.toString("base64");

    const prompt = `Estrai tutto il testo leggibile da questo documento. Se ci sono tabelle usa il Markdown. Se ci sono immagini descrivile. Non aggiungere introduzioni.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("Risposta vuota da Gemini");

    return text;
  } catch (error: any) {
    // Se l'errore è un 404, logga i dettagli specifici
    console.error("Dettagli Errore Gemini:", error.message);
    if (error.status === 404) {
      console.error(
        "CONSIGLIO: Verifica che la API Key sia creata su Google AI Studio (non Vertex AI) e di aver fatto 'npm install @google/generative-ai@latest'",
      );
    }
    return "";
  }
}

export const extractPdfChunk = async (client: DocumentProcessorServiceClient, document: PDFDocument): Promise<string> => {
  const content = await document.save()
  const name = `projects/${GCP_PROJECT_NUMBER}/locations/eu/processors/${GCP_PROCESSOR_ID}`;
  try {

    const [res] = await client.processDocument({
      name: name,
      rawDocument: {
        content: content,
        mimeType: 'application/pdf'
      }
    })
    return res.document?.text || ""
  }
  catch (err) {
    console.log(err);
    return ''
  }
}

export const extractPDFWithGoogleDocumentAI = async (
  buffer: Buffer
): Promise<string> => {
  const maxPages = 15;
  const sourceDoc = await PDFDocument.load(buffer)
  const totalPages = sourceDoc.getPageCount();
  const DOCUMENT_CLIENT = await getDocumentAiClient();
  const FifteenPagesChunks: PDFDocument[] = [];
  for (let i = 0; i < totalPages; i += maxPages) {
    const newDoc = await PDFDocument.create();
    const end = Math.min(i + maxPages, totalPages);
    const pageIndices = Array.from({ length: end - i }, (_, k) => i + k);
    const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach((page) => newDoc.addPage(page));
    FifteenPagesChunks.push(newDoc);
  }
  const extractions: string[] = [];
  for (const chunk of FifteenPagesChunks) {
    const text = await extractPdfChunk(DOCUMENT_CLIENT, chunk);
    extractions.push(text);
  }
  return extractions.join('\n');
}