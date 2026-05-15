import { buildAgent } from "./buildAgent";
import { retrieveRelevantDocumentsWithGemini } from "./embeddings/retrieveRelevantDocuments";
import { connectDatabase } from "../getDatabase";
import { getGeminiClient } from "./getClient";
import { Types } from "mongoose";
import { Material } from "../../models/schemas/material.schema";

// Estrae il testo dalla risposta, gestendo thinking models (thought parts) e .text accessor
function extractText(response: any): string | undefined {
  // Prima prova il getter .text del SDK
  try {
    if (response.text) return response.text;
  } catch {}
  // Fallback: cerca manualmente le parti di testo non-thought
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) return undefined;
  const textParts = parts
    .filter((p: any) => p.text && !p.thought)
    .map((p: any) => p.text);
  return textParts.length > 0 ? textParts.join("") : undefined;
}

// Tools declaration — search_materials + list_available_materials
const buildTools = (materialNames: string[]) => ({
  functionDeclarations: [
    {
      name: "search_materials",
      description:
        "Cerca nei materiali didattici ufficiali della materia per trovare informazioni su un NUOVO argomento specifico. " +
        "ATTENZIONE: NON chiamare questa funzione se l'utente si riferisce a qualcosa già presente nella conversazione " +
        "(es. 'punto 4', 'il secondo', 'non mi convince la 6', 'dimmi di più', 'esploriamo quello', 'cosa mi dici del punto X'). " +
        "In quei casi, la risposta è già nei turni precedenti della conversazione — NON cercare nei documenti. " +
        "Se l'utente specifica un documento o libro particolare, usa il parametro documentName per filtrare.",
      parameters: {
        type: "OBJECT" as const,
        properties: {
          query: {
            type: "STRING" as const,
            description:
              "Il concetto o argomento SPECIFICO da cercare. Deve contenere termini tecnici dell'argomento, " +
              "NON riferimenti generici come 'punto 7' o 'il secondo argomento'.",
          },
          documentName: {
            type: "STRING" as const,
            description:
              "OPZIONALE. Nome (o parte del nome) del documento specifico in cui cercare. " +
              "Usa SOLO se l'utente ha esplicitamente indicato un documento/libro/file specifico. " +
              `Documenti disponibili: ${materialNames.join(", ")}`,
          },
        },
        required: ["query"],
      },
    },
    {
      name: "list_available_materials",
      description:
        "Restituisce la lista di tutti i documenti/materiali didattici caricati per questa materia. " +
        "Chiama questo strumento quando l'utente chiede 'quali documenti hai?', 'che materiali ci sono?', " +
        "'mostrami i file', o quando c'è ambiguità su quale documento consultare.",
      parameters: {
        type: "OBJECT" as const,
        properties: {},
      },
    },
  ],
});

export async function generateAIResponseGemini(
  query: string,
  subjectId: Types.ObjectId,
  userRole: "teacher" | "student" | "admin" = "student",
  messagesHistory: { role: string; content: string }[],
) {
  try {
    const ai = await getGeminiClient();
    await connectDatabase();

    // 1. Verifica che ci siano materiali reali vettorizzati per questa materia
    const realMaterials = await Material.find(
      {
        subjectId,
        type: "file",
        vectorized: true,
        $or: [{ aiGenerated: { $exists: false } }, { aiGenerated: false }],
      },
      { _id: 1, name: 1 },
    ).lean();

    const hasMaterials = realMaterials.length > 0;
    const materialNames = realMaterials.map((m) => m.name);
    const realMaterialIds = realMaterials.map((m) => m._id as Types.ObjectId);

    // 2. System prompt (senza materiale inline — arriva via tool se necessario)
    const systemPrompt = await buildAgent(subjectId, userRole, hasMaterials);

    // 3. Multi-turn contents: storico + query corrente
    const historyContents = messagesHistory.map((msg) => ({
      role: msg.role === "agent" ? ("model" as const) : ("user" as const),
      parts: [{ text: msg.content }],
    }));

    const contents = [
      ...historyContents,
      { role: "user" as const, parts: [{ text: query }] },
    ];

    // 4. Tools config (include nomi documenti per aiutare Gemini a filtrare)
    const toolsConfig = hasMaterials ? [buildTools(materialNames)] : undefined;

    // 4. Prima chiamata: Gemini decide se ha bisogno del tool o può rispondere dalla conversazione
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: toolsConfig as any,
      },
    });

    // 5. Se Gemini ha richiesto un tool → eseguiamo e richiamiamo
    const candidate = response.candidates?.[0];
    const functionCall = candidate?.content?.parts?.find(
      (p: any) => p.functionCall,
    )?.functionCall;

    if (functionCall) {
      const modelTurnContent = candidate!.content!;
      let toolResult: string;

      if (functionCall.name === "list_available_materials") {
        console.log("[Tool] list_available_materials chiamato");
        const materialList = realMaterials
          .map((m, i) => `${i + 1}. ${m.name}`)
          .join("\n");
        toolResult = `Documenti disponibili per questa materia (${realMaterials.length} totali):\n${materialList}`;
      } else if (functionCall.name === "search_materials") {
        const searchQuery = (functionCall.args as any)?.query || query;
        const docNameFilter = (functionCall.args as any)?.documentName || "";
        console.log(
          `[Tool] search_materials query: "${searchQuery.slice(0, 100)}" | doc: "${docNameFilter}"`,
        );

        // Se è specificato un documentName, filtra i material IDs
        let filteredIds = realMaterialIds;
        if (docNameFilter) {
          const normalizedFilter = docNameFilter.toLowerCase();
          const matchingMaterials = realMaterials.filter((m) =>
            m.name.toLowerCase().includes(normalizedFilter),
          );
          if (matchingMaterials.length > 0) {
            filteredIds = matchingMaterials.map((m) => m._id as Types.ObjectId);
            console.log(
              `[Tool] Filtro documento: ${matchingMaterials.length} match su "${docNameFilter}"`,
            );
          } else {
            console.log(
              `[Tool] Nessun documento matcha "${docNameFilter}", cerco in tutti`,
            );
          }
        }

        const docs = await retrieveRelevantDocumentsWithGemini(
          searchQuery,
          subjectId,
          filteredIds,
        );

        if (docs.length > 0) {
          // Formatta con il nome del documento sorgente per ogni chunk
          toolResult = docs
            .map((d) => {
              const source = d.document_name
                ? `[📄 ${d.document_name}]`
                : "[📄 Documento]";
              return `${source}\n${d.text}`;
            })
            .join("\n\n---\n\n");
        } else {
          toolResult =
            "Nessuna informazione trovata nei materiali didattici per questa query.";
        }
        console.log(`[Tool] RAG risultato: ${toolResult.length} chars`);
      } else {
        toolResult = "Strumento non riconosciuto.";
      }

      // Seconda chiamata con il risultato del tool — SENZA tools per forzare risposta testuale
      const responseWithTool = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...contents,
          modelTurnContent,
          {
            role: "user" as const,
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: { result: toolResult },
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const toolResponseText = extractText(responseWithTool);
      if (!toolResponseText) {
        console.error(
          "[Tool] Seconda chiamata senza testo! Parts:",
          JSON.stringify(
            responseWithTool.candidates?.[0]?.content?.parts?.map((p: any) =>
              Object.keys(p),
            ),
          ),
        );
      }
      return (
        toolResponseText ||
        "Mi dispiace, non sono riuscito a generare una risposta."
      );
    }

    // 6. Nessun tool call — Gemini ha risposto direttamente (follow-up conversazionale)
    const directText = extractText(response);
    console.log(
      `[Tool] Nessuna function call — risposta diretta (${directText?.length || 0} chars)`,
    );

    return (
      directText || "Mi dispiace, non sono riuscito a generare una risposta."
    );
  } catch (error) {
    console.error("Errore nella generazione risposta Gemini:", error);
    throw error;
  }
}
