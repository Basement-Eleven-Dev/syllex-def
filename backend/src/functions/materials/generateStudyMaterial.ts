import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import { MaterialDocument, MaterialFileDB } from "./createMaterialWithFiles";
import { getRagResponse } from "../../_helpers/_ai-aws/assistant.service";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AWS_REGION } from "../../_helpers/config/env";
import { triggerBackgroundTask } from "../../_helpers/_utils/sqs.utils";
import { performIndexing } from "../../background/indexMaterial";
import PptxGenJS from "pptxgenjs";

const s3Client = new S3Client({ region: AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

//prova generazione slides
async function generatePowerPointFromContent(
  content: string,
  title: string,
  theme: "professional" | "educational" | "modern" = "educational"
): Promise<Buffer> {
  const pres = new PptxGenJS();

  // Configurazione temi
  const themes = {
    professional: {
      background: "FFFFFF",
      primary: "2E5090",
      secondary: "5B9BD5",
      accent: "ED7D31",
      text: "2F4F4F",
      lightBg: "F5F7FA",
    },
    educational: {
      background: "FFFFFF",
      primary: "4A90E2",
      secondary: "7ED321",
      accent: "F5A623",
      text: "333333",
      lightBg: "F8F9FA",
    },
    modern: {
      background: "1E1E1E",
      primary: "00D9FF",
      secondary: "7B68EE",
      accent: "FF6B6B",
      text: "FFFFFF",
      lightBg: "2D2D2D",
    },
  };

  const colors = themes[theme];
  pres.author = "Syllex AI";
  pres.subject = title;
  pres.title = title;
  pres.defineLayout({ name: "CUSTOM", width: 10, height: 5.625 });
  pres.layout = "CUSTOM";

  // Parsa il contenuto per estrarre slide
  const slides = parseMarkdownToSlidesImproved(content);

  // === SLIDE 1: COPERTINA  ===
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: colors.background };

  // Barra colorata in alto (sottile)
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.15,
    fill: { color: colors.primary },
  });

  // Titolo principale centrato
  titleSlide.addText(title, {
    x: 1,
    y: 2,
    w: 8,
    h: 1.2,
    fontSize: 44,
    bold: true,
    color: colors.primary,
    align: "center",
    fontFace: "Arial",
    valign: "middle",
  });

  // Linea decorativa sottile
  titleSlide.addShape(pres.ShapeType.line, {
    x: 3.5,
    y: 3.4,
    w: 3,
    h: 0,
    line: { color: colors.accent, width: 2 },
  });

  // Footer discreto
  titleSlide.addText("Generato da Syllex AI", {
    x: 1,
    y: 5,
    w: 8,
    h: 0.4,
    fontSize: 11,
    color: colors.text,
    align: "center",
    italic: true,
    transparency: 50,
  });

  // === SLIDE 2+: CONTENUTI PULITI E FUNZIONALI ===
  slides.forEach((slideData, index) => {
    // Salta slide vuote o con contenuto insufficiente
    if (slideData.content.length === 0 && !slideData.subtitle) {
      return;
    }

    const slide = pres.addSlide();

    // Sfondo alternato per varietà visiva
    const useLightBg = index % 2 === 0;
    slide.background = {
      color: useLightBg ? colors.lightBg : colors.background,
    };

    // ✅ TITOLO PIÙ PICCOLO E CON SPAZIO ADEGUATO
    let yPosition = 0.3;

    // Calcola altezza titolo dinamica (considera wrap su più righe)
    const titleLength = slideData.title.length;
    let titleHeight = 0.6;
    let titleFontSize = 20;

    //modifiche testuali
    slide.addText(slideData.title, {
      x: 0.5,
      y: yPosition,
      w: 9,
      h: titleHeight,
      fontSize: titleFontSize,
      bold: true,
      color: colors.primary,
      fontFace: "Arial",
      align: "left",
      valign: "middle", // 🔥 centra verticalmente dentro la box
      shrinkText: true, // 🔥 riduce automaticamente se il titolo è troppo lungo
      lineSpacing: 24,
      margin: 10,
    });

    yPosition += titleHeight + 0.15; // Spazio dopo il titolo

    // Numerazione pulita (angolo in basso a destra)
    slide.addText(`${index + 1}`, {
      x: 9.3,
      y: 5.1,
      w: 0.5,
      h: 0.3,
      fontSize: 12,
      color: colors.text,
      align: "right",
      transparency: 40,
    });

    // Calcola spazio disponibile per contenuto
    const maxContentHeight = 5.0 - yPosition;

    // Subtitle (se presente)
    if (slideData.subtitle) {
      slide.addText(slideData.subtitle, {
        x: 0.5,
        y: yPosition,
        w: 9,
        h: 0.35,
        fontSize: 16,
        bold: true,
        color: colors.secondary,
        fontFace: "Arial",
        italic: true,
      });
      yPosition += 0.45;
    }

    // ✅ GESTIONE RELAZIONI CON VALIDAZIONE
    const arrowItems = slideData.content.filter(
      (item) => item.includes("→") || item.includes("-->")
    );

    // Solo usa layout relazioni se ci sono ALMENO 2 items con frecce
    if (arrowItems.length >= 2) {
      // Layout speciale per relazioni/timeline
      arrowItems.forEach((item, i) => {
        if (i >= 5) return; // Max 5 relazioni per slide

        const cleanItem = item.replace(/-->/g, "→").replace(/\*\*/g, "");

        if (cleanItem.includes("→")) {
          const parts = cleanItem.split("→").map((p) => p.trim());

          // Calcola posizioni con spaziatura ottimale
          const boxY = yPosition + i * 0.85;
          const boxHeight = 0.65;

          // Parte sinistra (etichetta) - box colorato
          slide.addShape(pres.ShapeType.rect, {
            x: 0.6,
            y: boxY,
            w: 2.8,
            h: boxHeight,
            fill: { color: colors.primary, transparency: 20 },
            line: { color: colors.primary, width: 1.5 },
          });
          slide.addText(parts[0], {
            x: 0.65,
            y: boxY + 0.05,
            w: 2.7,
            h: boxHeight - 0.1,
            fontSize: 13,
            bold: true,
            color: colors.text,
            align: "center",
            valign: "middle",
            fontFace: "Arial",
          });

          // Freccia elegante
          slide.addShape(pres.ShapeType.rtTriangle, {
            x: 3.55,
            y: boxY + 0.2,
            w: 0.25,
            h: 0.25,
            fill: { color: colors.accent },
            rotate: 270,
          });

          // Parte destra (descrizione) - testo scorrevole
          slide.addText(parts[1] || "", {
            x: 4.0,
            y: boxY + 0.05,
            w: 5.5,
            h: boxHeight - 0.1,
            fontSize: 13,
            color: colors.text,
            valign: "middle",
            fontFace: "Arial",
          });
        }
      });
      return; // Fine gestione relazioni
    }

    // ✅ CONTENUTO NORMALE (paragrafi o liste)
    if (slideData.content.length > 0) {
      const hasLongParagraphs = slideData.content.some(
        (item) => item.length > 100
      );

      // Calcola font size dinamico basato su contenuto totale
      const totalChars = slideData.content.join(" ").length;
      let contentFontSize = 18;
      let lineSpacing = 28;

      if (totalChars > 600) {
        contentFontSize = 14;
        lineSpacing = 20;
      } else if (totalChars > 400) {
        contentFontSize = 16;
        lineSpacing = 22;
      } else if (totalChars > 250) {
        contentFontSize = 16;
        lineSpacing = 24;
      }

      if (hasLongParagraphs) {
        // LAYOUT PARAGRAFI
        const paragraphText = slideData.content.join("\n\n");
        slide.addText(paragraphText, {
          x: 0.5,
          y: yPosition,
          w: 9,
          h: maxContentHeight,
          fontSize: contentFontSize,
          color: colors.text,
          fontFace: "Arial",
          lineSpacing: lineSpacing - 4,
          valign: "top",
          align: "left",
        });
      } else {
        // LAYOUT LISTE
        const isBulletList = slideData.content.length <= 8;

        if (isBulletList) {
          slide.addText(slideData.content.join("\n"), {
            x: 0.5,
            y: yPosition,
            w: 9,
            h: maxContentHeight,
            fontSize: contentFontSize,
            color: colors.text,
            bullet: { type: "number", code: "2022" },
            fontFace: "Arial",
            lineSpacing: lineSpacing,
            valign: "top",
          });
        } else {
          // Due colonne
          const half = Math.ceil(slideData.content.length / 2);
          const leftContent = slideData.content.slice(0, half);
          const rightContent = slideData.content.slice(half);

          slide.addText(leftContent.join("\n"), {
            x: 0.5,
            y: yPosition,
            w: 4.3,
            h: maxContentHeight,
            fontSize: contentFontSize - 1,
            color: colors.text,
            bullet: true,
            fontFace: "Arial",
            lineSpacing: lineSpacing - 4,
          });

          slide.addText(rightContent.join("\n"), {
            x: 5.1,
            y: yPosition,
            w: 4.3,
            h: maxContentHeight,
            fontSize: contentFontSize - 1,
            color: colors.text,
            bullet: true,
            fontFace: "Arial",
            lineSpacing: lineSpacing - 4,
          });
        }
      }
    }

    // Note speaker
    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
  });

  const pptxData = await pres.write({ outputType: "nodebuffer" });
  return pptxData as Buffer;
}

// Helper per parsare Markdown in slide
function parseMarkdownToSlidesImproved(markdown: string): Array<{
  title: string;
  subtitle?: string;
  content: string[];
  notes?: string;
}> {
  const slides: Array<{
    title: string;
    subtitle?: string;
    content: string[];
    notes?: string;
  }> = [];

  // Split per header di livello 2 (## Titolo)
  const sections = markdown.split(/^##\s+/m).filter((s) => s.trim());

  sections.forEach((section) => {
    const lines = section
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    if (lines.length === 0) return;

    // ✅ Pulisce il titolo da # e ** residui
    const title = lines[0]
      .replace(/^#+\s*/, "") // Rimuove # all'inizio
      .replace(/\*\*/g, "") // Rimuove bold
      .trim();

    let subtitle: string | undefined;
    const content: string[] = [];
    let currentParagraph = "";
    let inQuote = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Ignora visual notes
      if (line.match(/^(📸|🖼️|\[Visual|Visual:|Image:)/i)) {
        continue;
      }

      // Skip header di livello 3+
      if (line.startsWith("###") || line.startsWith("####")) {
        continue;
      }

      // Cattura subtitle
      if (
        i === 1 &&
        line.startsWith("**") &&
        line.endsWith("**") &&
        !line.includes(":")
      ) {
        subtitle = line.replace(/\*\*/g, "").trim();
        continue;
      }

      // Gestisci quote blocks
      if (line.startsWith(">")) {
        inQuote = true;
        const quoteText = line.replace(/^>\s*/, "").replace(/\*\*/g, "").trim();
        if (quoteText) {
          content.push(`"${quoteText}"`);
        }
        continue;
      }

      if (inQuote && !line.startsWith(">")) {
        inQuote = false;
      }

      // Gestisci strutture "Label: content" o "Label → content"
      if (
        line.match(/^\*\*[^*]+\*\*:\s+/) ||
        line.match(/^\*\*[^*]+\*\*\s*(→|-->)\s*/)
      ) {
        const cleanLine = line.replace(/\*\*/g, "").trim();
        content.push(cleanLine);
        continue;
      }

      // Gestisci liste puntate/numerate
      if (line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/)) {
        const cleanLine = line
          .replace(/^[-*•]\s+/, "")
          .replace(/^\d+\.\s+/, "")
          .replace(/\*\*/g, "")
          .trim();
        if (cleanLine.length > 0) {
          content.push(cleanLine);
        }
        currentParagraph = "";
        continue;
      }

      // Gestisci paragrafi normali
      if (
        line.length > 20 &&
        !line.match(/^[-*•]\s+/) &&
        !line.match(/^\d+\.\s+/)
      ) {
        if (currentParagraph) {
          currentParagraph += " " + line.replace(/\*\*/g, "").trim();
        } else {
          currentParagraph = line.replace(/\*\*/g, "").trim();
        }

        if (line.match(/[.!?]$/) || i === lines.length - 1) {
          if (currentParagraph.length > 0) {
            content.push(currentParagraph);
            currentParagraph = "";
          }
        }
        continue;
      }

      // Linee brevi
      if (
        line.length > 0 &&
        !line.match(/^[-*•]\s+/) &&
        !line.match(/^\d+\.\s+/)
      ) {
        const cleanLine = line.replace(/\*\*/g, "").trim();
        if (cleanLine && cleanLine !== "---") {
          content.push(cleanLine);
        }
      }
    }

    // Aggiungi paragrafo finale
    if (currentParagraph) {
      content.push(currentParagraph);
    }

    // ✅ Crea la slide solo se ha contenuto sufficiente (almeno 20 caratteri totali)
    const totalContent = content.join(" ");
    if (totalContent.length > 20 || subtitle) {
      slides.push({
        title,
        subtitle,
        content,
      });
    }
  });

  return slides;
}

// Genera un SVG statico con le posizioni calcolate automaticamente
function generateStaticMermaidSvg(
  mermaidContent: string,
  title: string
): Buffer {
  try {
    const lines = mermaidContent
      .split("\n")
      .filter((line) => line.trim() && !line.includes("graph TD"));
    const nodes = new Map<
      string,
      { id: string; label: string; type: string }
    >();
    const connections: Array<{ from: string; to: string }> = [];

    lines.forEach((line) => {
      const trimmed = line.trim().replace(/;$/, "");

      if (trimmed.includes("-->")) {
        const [from, to] = trimmed.split("-->").map((s) => s.trim());
        const fromId = from.split(/[\[\(]/)[0];
        const toId = to.split(/[\[\(]/)[0];
        connections.push({ from: fromId, to: toId });

        extractNodeInfo(from, nodes);
        extractNodeInfo(to, nodes);
      }
    });

    const nodePositions = calculateImprovedNodePositions(
      Array.from(nodes.keys()),
      connections
    );

    // ⭐ DIMENSIONI DINAMICHE OTTIMIZZATE
    const levelCounts = new Map<number, number>();
    nodePositions.forEach((pos) => {
      const level = Math.round(pos.y / 100);
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    });
    const maxNodesPerLevel = Math.max(...Array.from(levelCounts.values()));

    const svgWidth = Math.max(800, maxNodesPerLevel * 160 + 200);
    const maxY = Math.max(
      ...Array.from(nodePositions.values()).map((p) => p.y)
    );
    const svgHeight = maxY + 100; // Solo 100px di padding in fondo

    let svgContent = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <defs>
    <style>
      .node-rect { 
        fill: #f8f9fa; 
        stroke: #495057; 
        stroke-width: 2;
        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
      }
      .node-circle { 
        fill: #e3f2fd; 
        stroke: #1976d2; 
        stroke-width: 2;
        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
      }
      .node-text { 
        font-family: 'Segoe UI', Arial, sans-serif; 
        font-size: 12px; 
        text-anchor: middle; 
        fill: #212529; 
        font-weight: 500;
      }
      .edge { 
        stroke: #6c757d; 
        stroke-width: 2; 
        fill: none; 
        marker-end: url(#arrowhead);
        opacity: 0.7;
      }
      .title { 
        font-family: 'Segoe UI', Arial, sans-serif; 
        font-size: 20px; 
        font-weight: bold; 
        text-anchor: middle; 
        fill: #212529; 
      }
    </style>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#6c757d" />
    </marker>
  </defs>
  
  <text x="${svgWidth / 2}" y="30" class="title">${title}</text>`;

    // ⭐ CONNESSIONI CON CURVE SMOOTH
    connections.forEach((conn) => {
      const fromPos = nodePositions.get(conn.from);
      const toPos = nodePositions.get(conn.to);
      if (fromPos && toPos) {
        // Usa curve quadratiche per connessioni più eleganti
        const midY = (fromPos.y + toPos.y) / 2;
        svgContent += `
  <path d="M ${fromPos.x} ${fromPos.y} Q ${fromPos.x} ${midY} ${toPos.x} ${toPos.y}" class="edge" />`;
      }
    });

    // ⭐ NODI CON DIMENSIONI ADATTIVE
    nodes.forEach((node, id) => {
      const pos = nodePositions.get(id);
      if (pos) {
        const isCircle = node.type === "circle";

        if (isCircle) {
          // Cerchi con raggio adattivo
          const radius = Math.max(30, Math.min(45, node.label.length * 2));
          svgContent += `
  <circle cx="${pos.x}" cy="${pos.y}" r="${radius}" class="node-circle" />`;
        } else {
          // Rettangoli con larghezza adattiva
          const textWidth = Math.max(node.label.length * 8, 100);
          const rectWidth = textWidth + 20;
          svgContent += `
  <rect x="${pos.x - rectWidth / 2}" y="${pos.y - 25
            }" width="${rectWidth}" height="50" rx="8" class="node-rect" />`;
        }

        // ⭐ TESTO OTTIMIZZATO CON WRAP INTELLIGENTE
        const maxCharsPerLine = isCircle ? 8 : 15;
        const lines = wrapText(node.label, maxCharsPerLine);

        lines.forEach((line, index) => {
          const yOffset =
            lines.length === 1 ? 4 : (index - (lines.length - 1) / 2) * 14;
          svgContent += `
  <text x="${pos.x}" y="${pos.y + yOffset}" class="node-text">${line}</text>`;
        });
      }
    });

    svgContent += `
</svg>`;

    return Buffer.from(svgContent);
  } catch (error) {
    console.error("Errore nella generazione SVG statico:", error);
    throw error;
  }
}

// Helper per il wrap del testo
function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Parola troppo lunga, spezzala
        if (word.length > maxChars) {
          lines.push(word.substring(0, maxChars - 1) + "-");
          currentLine = word.substring(maxChars - 1);
        } else {
          currentLine = word;
        }
      }
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

// Helper per estrarre informazioni sui nodi
function extractNodeInfo(nodeString: string, nodes: Map<string, any>) {
  let id,
    label,
    type = "rect";

  if (nodeString.includes("[") && nodeString.includes("]")) {
    // Nodo rettangolare: A[Label]
    const match = nodeString.match(/(\w+)\[([^\]]+)\]/);
    if (match) {
      id = match[1];
      label = match[2];
    }
  } else if (nodeString.includes("(") && nodeString.includes(")")) {
    // Nodo circolare: A(Label)
    const match = nodeString.match(/(\w+)\(([^)]+)\)/);
    if (match) {
      id = match[1];
      label = match[2];
      type = "circle";
    }
  } else {
    // Nodo semplice
    id = nodeString.trim();
    label = id;
  }

  if (id && !nodes.has(id)) {
    nodes.set(id, { id, label: label || id, type });
  }
}

// Calcola posizioni dei nodi in un layout gerarchico migliorato
function calculateImprovedNodePositions(
  nodeIds: string[],
  connections: Array<{ from: string; to: string }>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const levels = new Map<string, number>();
  const childrenCount = new Map<string, number>();

  // Trova i nodi radice (senza genitori)
  const hasParent = new Set(connections.map((c) => c.to));
  const roots = nodeIds.filter((id) => !hasParent.has(id));

  // Conta i figli per ogni nodo
  connections.forEach((conn) => {
    childrenCount.set(conn.from, (childrenCount.get(conn.from) || 0) + 1);
  });

  // Assegna livelli ai nodi
  function assignLevel(
    nodeId: string,
    level: number,
    visited: Set<string> = new Set()
  ) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    levels.set(nodeId, Math.max(levels.get(nodeId) || 0, level));

    const children = connections
      .filter((c) => c.from === nodeId)
      .map((c) => c.to);
    children.forEach((child) => assignLevel(child, level + 1, visited));
  }

  roots.forEach((root) => assignLevel(root, 0));
  nodeIds.forEach((id) => {
    if (!levels.has(id)) levels.set(id, 0);
  });

  // Raggruppa nodi per livello
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(nodeId);
  });

  // ⭐ CALCOLO OTTIMIZZATO DELLE DIMENSIONI
  const maxLevel = Math.max(...Array.from(levels.values()));
  const maxNodesPerLevel = Math.max(
    ...Array.from(levelGroups.values()).map((nodes) => nodes.length)
  );

  // Dimensioni dinamiche basate sul contenuto
  const minNodeWidth = 120; // Larghezza minima per ogni nodo
  const nodeMargin = 40; // Margine tra i nodi
  const svgWidth = Math.max(
    800,
    maxNodesPerLevel * (minNodeWidth + nodeMargin) + 200
  );

  // Altezza ottimizzata - elimina lo scroll eccessivo
  const levelHeight = 100; // Ridotto da 140 a 100
  const topPadding = 80;
  const bottomPadding = 50; // Padding minimo in fondo
  const svgHeight = topPadding + maxLevel * levelHeight + bottomPadding;

  // ⭐ POSIZIONAMENTO INTELLIGENTE DEI NODI
  levelGroups.forEach((nodes, level) => {
    const y = topPadding + level * levelHeight;

    if (nodes.length === 1) {
      // Un solo nodo: centro perfetto
      positions.set(nodes[0], { x: svgWidth / 2, y });
    } else if (nodes.length === 2) {
      // Due nodi: distribuzione equilibrata
      const spacing = Math.min(svgWidth / 3, 250);
      positions.set(nodes[0], { x: svgWidth / 2 - spacing / 2, y });
      positions.set(nodes[1], { x: svgWidth / 2 + spacing / 2, y });
    } else {
      // Più nodi: distribuzione uniforme con spaziatura adattiva
      const totalWidth = svgWidth - 120; // margini laterali
      const maxSpacing = 200; // spaziatura massima tra nodi
      const minSpacing = 100; // spaziatura minima tra nodi

      let nodeSpacing = totalWidth / (nodes.length + 1);
      nodeSpacing = Math.max(minSpacing, Math.min(maxSpacing, nodeSpacing));

      // Se la spaziatura calcolata è troppo grande, usa la massima
      const actualTotalWidth = nodeSpacing * (nodes.length - 1);
      const startX = (svgWidth - actualTotalWidth) / 2;

      nodes.forEach((nodeId, index) => {
        const x = startX + index * nodeSpacing;
        positions.set(nodeId, { x, y });
      });
    }
  });

  return positions;
}

// SOLUZIONE 2: Usa un servizio esterno per la renderizzazione (opzionale)
async function generateMermaidViaAPI(mermaidContent: string): Promise<Buffer> {
  try {
    // Usa un servizio come mermaid.ink o quickchart.io
    const encodedContent = encodeURIComponent(mermaidContent);
    const response = await fetch(
      `https://mermaid.ink/img/${encodedContent}?type=svg`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const svgBuffer = Buffer.from(await response.arrayBuffer());
    return svgBuffer;
  } catch (error) {
    console.error("Errore nel servizio esterno Mermaid:", error);
    throw error;
  }
}

// Helper per ottenere il prefisso del titolo in base al tipo
function getTitlePrefix(generationType: string): string {
  switch (generationType) {
    case "summary":
      return "Riassunto di";
    case "glossary":
      return "Glossario di";
    case "faq":
      return "Approfondimento (FAQ) su";
    case "concept-map":
      return "Mappa Concettuale di";
    case "presentation":
      return "Presentazione su";
    default:
      return "Materiale generato da";
  }
}

// FUNZIONE PER COMPLETARE LA GENERAZIONE IN BACKGROUND
async function completeMaterialGeneration(
  materialId: string,
  params: {
    sourceMaterialIds: string[];
    generationType: string;
    language: string;
    focusTopics: string[];
    finalTitle: string;
    userId: ObjectId;
  }
) {
  const db: Db = (await mongoClient()).db(DB_NAME);

  try {
    if (!BUCKET_NAME) {
      throw new Error(
        "Nome del bucket S3 non configurato nelle variabili d'ambiente."
      );
    }

    const materialsCollection = db.collection("materials");
    const materialObjectIds = params.sourceMaterialIds.map(
      (id: string) => new ObjectId(id)
    );

    const sourceMaterials = await materialsCollection
      .find({
        _id: { $in: materialObjectIds },
        teacherId: params.userId,
      })
      .toArray();

    if (sourceMaterials.length !== params.sourceMaterialIds.length) {
      throw new Error(
        "Uno o più materiali di origine non trovati o non autorizzati."
      );
    }

    const systemPrompt = `You are a world-class AI assistant acting as an expert instructional designer. Your task is to create professional didactic materials.

    **CRITICAL RULES:**
    1.  **KNOWLEDGE SOURCE:** Your ONLY source of information is the provided context. It is FORBIDDEN to use your general knowledge.
    2.  **LANGUAGE:** Your entire output MUST be written in **${params.language}**.
    3.  **TONE:** Your tone should be authoritative, academic, but clear and accessible.
    4.  **FORMATTING:** Use rich Markdown extensively (headings, bold, lists, blockquotes) to create a well-structured and readable document.
    5.  **CONTENT FOCUS:** Stay strictly focused on the factual content, events, characters, and concrete information from the source material. Avoid abstract philosophical interpretations unless they are explicitly mentioned in the text.`;

    let userQuery = "";

    // Logica dinamica per il prompt
    const topicInstruction =
      params.focusTopics &&
        Array.isArray(params.focusTopics) &&
        params.focusTopics.length > 0
        ? `Focus EXCLUSIVELY on the following topics: ${params.focusTopics.join(
          ", "
        )}.`
        : "Base your work on the entire provided context.";

    switch (params.generationType) {
      case "summary":
        userQuery = `Create a comprehensive academic summary based EXCLUSIVELY on the content provided. ${topicInstruction}

**CRITICAL INSTRUCTIONS:**
- Focus on CONCRETE CONTENT: events, characters, plot points, historical facts, specific information
- Avoid abstract interpretations or philosophical themes unless explicitly stated in the source
- Summarize what actually happens, who the characters are, what they do
- Include specific details, names, places, and factual information from the text

**REQUIRED STRUCTURE:**
1. **Introduction** (2-3 sentences): Brief overview of the main subject/work being summarized

2. **Key Content Sections**: Identify 4-6 main content areas. For each section:
   - Use a descriptive subtitle (### Section Title)
   - Provide 2-3 paragraphs explaining the concrete content
   - Include specific examples, names, events from the text
   - Focus on what actually happens or what is explicitly stated

3. **Summary and Connections** (1-2 paragraphs): Connect the main content areas and highlight their significance

**REQUIREMENTS:**
- Length: 800-1200 words
- Style: Academic but accessible for students
- Use bold for key terms and names
- Include direct quotes when relevant (max 1-2 per section)
- Stay factual and concrete, avoid abstract interpretations`;
        break;
      case "glossary":
        userQuery = `Extract and define the 15-20 most important terms from the provided context. ${topicInstruction}

**REQUIRED FORMAT:**
For each term, create a structured entry:

**[TERM]**
- **Definition**: Clear, concise explanation (1-2 sentences)
- **Context**: How it's used in the original text
> *Example or quote from the text illustrating the term's usage*

**SELECTION CRITERIA:**
- Technical or specialized terms
- Key concepts essential for understanding
- Character names and their significance
- Place names and their importance
- Historical or cultural references mentioned in the text
- Terms that might be difficult for students

**REQUIREMENTS:**
- Organize alphabetically
- Precise definitions of 20-50 words
- Concrete examples from the text
- Avoid overly general or obvious terms`;
        break;
      case "faq":
        userQuery = `Generate 12-15 strategic frequently asked questions that a student would ask to deepen understanding of the material. ${topicInstruction}

**TYPES OF QUESTIONS TO CREATE:**
1. **"Why" questions** - To understand causes and motivations
2. **"How" questions** - To understand processes and mechanisms  
3. **"What if" questions** - To explore alternative scenarios
4. **Comparative questions** - To connect different concepts
5. **Detail questions** - To go beyond the basics
6. **Character/plot questions** - About specific people or events mentioned

**FORMAT:**
## **Q: [Specific, targeted question]**

**A:** Complete and structured answer (100-150 words) that:
- Directly answers the question
- Provides additional context
- Includes specific examples from the material
- Connects to other concepts when relevant

**REQUIREMENTS:**
- Progressive questions: from basics to deeper insights
- Answers supported by evidence from the text
- Clear and pedagogically effective language
- Avoid overly simple or repetitive questions
- Focus on concrete content rather than abstract themes`;
        break;
      case "concept-map":
        userQuery = `Create a concept map representing the hierarchical structure and relationships between the main concepts from the content. ${topicInstruction}

**CRITICAL RULES:**
1. Response MUST be ONLY a valid Mermaid diagram with "graph TD" syntax
2. DO NOT include explanatory text, headers, or markdown code blocks
3. Create a clear hierarchy with 1 main concept at the top
4. Develop 3-4 secondary concepts under the main one
5. Add 2-3 specific details under each secondary concept 
6. Focus on CONCRETE CONTENT: characters, places, events, specific elements

**NODE GUIDELINES:**
- **Concise labels**: Maximum 2-3 words per node
- **Specific terms**: Use concrete names and terms from the source material
- **Logical hierarchy**: From general to specific
- **Clear relationships**: Each arrow should indicate a logical connection
- **Content focus**: Prioritize factual elements over abstract concepts

**REQUIRED SYNTAX:**
- Use \`A[Main Concept]\` for rectangular nodes
- Use \`B(Specific Detail)\` for circular nodes (only for lowest levels)  
- Use \`-->\` for connections
- NO special characters or accents in node names (use simple ASCII)

**EXAMPLE OF GOOD STRUCTURE:**
graph TD;
    Opera[Main Work] --> Parte1[First Part];
    Opera --> Parte2[Second Part];
    Opera --> Parte3[Third Part];
    Parte1 --> Personaggio1(Character A);
    Parte1 --> Evento1(Event A);
    Parte2 --> Personaggio2(Character B);
    Parte2 --> Luogo1(Place A);
    Parte3 --> Tema1(Theme A);
    Parte3 --> Conclusione(Conclusion);`;
        break;
      case "presentation":
        userQuery = `Create a professional, visually engaging presentation based EXCLUSIVELY on the content provided. ${topicInstruction}
        
        **CRITICAL INSTRUCTIONS:**
        - Design slides like a professional presentation designer, NOT like a text document
        - VARY the content format: use paragraphs, comparisons, timelines, quotes - NOT just bullet lists
        - Each slide should tell a mini-story or convey ONE clear idea memorably
        - Use concrete details: names, dates, places, specific events from the source material
        - Keep content concise but SUBSTANTIAL - never create nearly empty slides
        - Write EVERYTHING in ${params.language} (including titles like "Punti Chiave" not "Key Takeaways")
        
        **MANDATORY FIRST CONTENT SLIDE:**
        The first slide after the title MUST be an overview/introduction that:
        - Provides context about what will be covered
        - Highlights 3-4 main themes or topics
        - Sets expectations for the presentation
        - Has at least 100 words of content
        - Uses narrative format (NOT bullets for this slide)
        
        Example first slide:
        ## Panoramica
        Questa presentazione esplora [main topic] attraverso l'analisi di [key aspects]. Esamineremo come [concept A] si relaziona con [concept B], il ruolo cruciale di [element C], e l'impatto di [event D] sullo sviluppo complessivo. Particolare attenzione verrà data a [specific focus] che rappresenta un punto di svolta fondamentale nella comprensione del tema.
        
        **SLIDE STRUCTURE VARIETY - Use different formats:**
        
        **Format 1 - Narrative Slide (USE FOR FIRST SLIDE):**
        ## Compelling Title
        [3-4 sentences of flowing narrative text explaining the concept with specific details, names, and context from the source material. Minimum 100 words, maximum 200 words.]
        
        **Format 2 - Comparison Slide:**
        ## Title Highlighting Contrast
        **Concept A:** [Brief explanation with specific example - 30-40 words]
        **Concept B:** [Brief explanation with specific example - 30-40 words]
        **Key difference:** [One sentence capturing the essential contrast]
        
        **Format 3 - Quote + Context Slide:**
        ## Impactful Title
        > "[Memorable quote from the source material]"
        
        [2-3 sentences explaining why this quote matters and what it reveals about the topic - minimum 50 words]
        
        **Format 4 - Key Point with Details:**
        ## Clear Title
        [Opening sentence introducing the main idea]
        
        The core concept involves [specific detail]. For example, [concrete example from text with names/dates]. This demonstrates [insight or connection]. [Add another sentence for depth - total 80-120 words]
        
        **Format 5 - Relationships/Process (USE SPARINGLY - MAX 2 SLIDES):**
        ## Title Describing Progression
        
        **Concept 1** → [Detailed explanation with specifics - minimum 15 words describing what this means and why it matters]
        
        **Concept 2** → [Detailed explanation with consequences - minimum 15 words explaining the development]
        
        **Concept 3** → [Detailed explanation with outcomes - minimum 15 words providing closure and significance]
        
        ⚠️ CRITICAL FOR FORMAT 5:
        - Use this format ONLY when you have AT LEAST 3 substantial relationships to show
        - Each relationship must have DETAILED explanations (15+ words on the right side)
        - NEVER create a Format 5 slide with only 1-2 items
        - If you have only 1-2 relationships, use Format 4 instead with narrative text
        - Use "→" arrow, never "-->"
        
        **REQUIREMENTS:**
        - Create 10-15 slides total
        - FIRST SLIDE: Must be Format 1 (Overview/Introduction) with 100+ words
        - Use Format 5 (relationships) MAXIMUM 2 times in entire presentation
        - Format 5 requires AT LEAST 3 relationships per slide (never 1-2)
        - NO MORE than 2 consecutive slides with the same format
        - Include at least 2 quote slides if source material has notable quotes
        - Last slide: Title "Punti Chiave" (Italian) or equivalent in ${params.language}, with 5-6 concise but complete insights
        - Every slide must have SUBSTANTIAL content (minimum 60 words or 4 bullet points)
        - Never create slides with just 1-2 short sentences
        - Middle slides: Mix of narrative paragraphs (preferred), comparisons, quotes
        - Every slide must include specific details from the source (names, dates, places, events)
        - Avoid generic statements - be concrete and specific
        
        **CONTENT DENSITY RULES:**
        - Minimum content per slide: 60 words OR 4 bullet points OR 3 relationships
        - Maximum content per slide: 250 words
        - If a topic doesn't have enough substance for a full slide, combine it with related topics
        - Better to have 10 substantial slides than 15 half-empty ones
        
        **Remember:** 
        - Paragraphs are better than lists for narrative content
        - Use lists ONLY when actually listing items, steps, or takeaways
        - Every slide should be visually distinct and content-rich
        - Specific details make slides memorable - avoid abstractions
        - First slide sets the tone - make it comprehensive and engaging
        - Format 5 (relationships) is powerful but overused becomes repetitive - use wisely`;
        break;
    }

    const generatedContent = await getRagResponse(
      userQuery,
      params.sourceMaterialIds,
      systemPrompt,
      "generate-study-material"
    );

    let finalFileName = `${params.generationType}_${params.finalTitle.replace(
      /\s+/g,
      "_"
    )}.md`;
    let finalMimeType = "text/markdown";
    let finalContentBuffer = Buffer.from(generatedContent, "utf-8");

    if (params.generationType === "presentation") {
      finalFileName += ".pptx";
      finalMimeType =
        "application/vnd.openxmlformats-officedocument.presentationml.presentation";

      try {
        console.log("Generazione presentazione PPTX...");
        // ⬇️ CAMBIA QUESTA RIGA - passa il titolo reale invece di "Presentazione"
        finalContentBuffer = Buffer.from(
          await generatePowerPointFromContent(
            generatedContent,
            params.finalTitle // ✅ Usa il titolo reale del materiale
          )
        );
        console.log("Presentazione PPTX generata con successo!");
      } catch (pptxError) {
        console.error("Errore nella generazione PPTX:", pptxError);
        // Fallback: salva come markdown
        finalFileName = finalFileName.replace(".pptx", ".md");
        finalMimeType = "text/markdown";
        finalContentBuffer = Buffer.from(generatedContent);
      }
    } else if (params.generationType === "concept-map") {
      finalFileName = `${params.generationType}_${params.finalTitle.replace(
        /\s+/g,
        "_"
      )}.svg`;
      finalMimeType = "image/svg+xml";

      try {
        console.log("Tentativo di generazione SVG statico...");
        finalContentBuffer = Buffer.from(
          await generateStaticMermaidSvg(generatedContent, params.finalTitle)
        );
        console.log("SVG statico generato con successo!");
      } catch (staticError) {
        console.warn(
          "Generazione SVG statica fallita, provo servizio esterno:",
          staticError
        );
        try {
          finalContentBuffer = Buffer.from(
            await generateMermaidViaAPI(generatedContent)
          );
          console.log("SVG generato tramite servizio esterno!");
        } catch (apiError) {
          console.error("Anche il servizio esterno è fallito:", apiError);
          // Fallback finale: genera un file HTML con Mermaid che funziona nel browser
          finalFileName = `${params.generationType}_${params.finalTitle.replace(
            /\s+/g,
            "_"
          )}.html`;
          finalMimeType = "text/html";
          finalContentBuffer = Buffer.from(`
<!DOCTYPE html>
<html>
<head>
    <title>${params.finalTitle}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.0.0/dist/mermaid.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .mermaid { 
            text-align: center; 
            margin: 30px 0; 
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .code-block { 
            background: #f5f5f5; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0;
            font-family: monospace;
            white-space: pre-wrap;
            border: 1px solid #ddd;
        }
        .instructions {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #1976d2;
        }
    </style>
</head>
<body>
    <h1>${params.finalTitle}</h1>
    <div class="mermaid">
${generatedContent}
    </div>
    
    <h2>Codice Mermaid (per copia/incolla)</h2>
    <div class="code-block">${generatedContent}</div>
    
    <div class="instructions">
        <p><strong>Come usare questo codice:</strong></p>
        <ul>
            <li>Copia il codice sopra</li>
            <li>Vai su <a href="https://mermaid.live" target="_blank">mermaid.live</a></li>
            <li>Incolla il codice per visualizzarlo e modificarlo</li>
            <li>Puoi esportarlo come PNG, SVG o PDF</li>
        </ul>
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true, 
            theme: 'default',
            flowchart: {
                nodeSpacing: 50,
                rankSpacing: 80,
                curve: 'basis'
            }
        });
    </script>
</body>
</html>`);
        }
      }
    } else {
      finalFileName = `${params.generationType}_${params.finalTitle.replace(
        /\s+/g,
        "_"
      )}.md`;
      finalMimeType = "text/markdown";
      finalContentBuffer = Buffer.from(generatedContent);
    }

    const serverFileName = `${Date.now()}-${finalFileName}`;
    const newStoragePath = `materials_uploads/${params.userId.toString()}/${serverFileName}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: newStoragePath,
      Body: finalContentBuffer,
      ContentType: finalMimeType,
    });
    await s3Client.send(uploadCommand);

    // 3. Creiamo l'oggetto file per il database
    const newFileData: MaterialFileDB = {
      originalName: finalFileName,
      serverFilename: serverFileName,
      storagePath: newStoragePath,
      mimetype: finalMimeType,
      size: finalContentBuffer.length,
    };

    const sourceTitles = sourceMaterials.map((m) => m.title).join(" + ");

    // Aggiorna il materiale con i file generati
    await materialsCollection.updateOne(
      { _id: new ObjectId(materialId) },
      {
        $set: {
          files: [newFileData],
          description: `Materiale generato dall'IA a partire da "${sourceTitles}".`,
          updatedAt: new Date(),
          generationStatus: "completed",
          // IMPORTANTE: resetta lo stato di indicizzazione
          indexingStatus: "pending",
        },
      }
    );

    console.log(
      `[completeMaterialGeneration] Generazione completata. Avvio indicizzazione per ${materialId}`
    );
    await triggerBackgroundTask(
      process.env.INDEXING_QUEUE_URL,
      materialId,
      () => performIndexing(materialId)
    );

    console.log(
      `[completeMaterialGeneration] Materiale ${materialId} generato e indicizzazione triggerata!`
    );
    console.log(
      `Materiale ${materialId} generato e trigger indicizzazione inviato!`
    );

    console.log(`Materiale ${materialId} generato e indicizzato con successo!`);
  } catch (error) {
    console.error(
      `Errore nella generazione del materiale ${materialId}:`,
      error
    );

    // In caso di errore, aggiorna lo stato
    const materialsCollection = db.collection("materials");
    await materialsCollection.updateOne(
      { _id: new ObjectId(materialId) },
      {
        $set: {
          generationStatus: "failed",
          updatedAt: new Date(),
        },
      }
    );
    throw error;
  }
}

// Estendi l'interfaccia MaterialDocument per includere generationStatus
declare module "./createMaterialWithFiles" {
  interface MaterialDocument {
    generationStatus?: "in-progress" | "completed" | "failed";
  }
}

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const {
    sourceMaterialIds,
    generationType,
    language = "italian",
    newTitle,
    focusTopics,
    subjectId,
    organizationId,
  } = JSON.parse(req.body || "{}");

  if (
    !sourceMaterialIds ||
    !Array.isArray(sourceMaterialIds) ||
    sourceMaterialIds.length === 0
  ) {
    return res.status(400).json({
      message: "È necessario fornire almeno un ID di materiale di origine.",
    });
  }
  if (
    !["summary", "glossary", "faq", "concept-map", "presentation"].includes(
      generationType
    )
  ) {
    return res.status(400).json({ message: "Tipo di generazione non valido." });
  }
  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res.status(400).json({
      message: "È necessario specificare una materia (subjectId) valida.",
    });
  }
  if (!organizationId || !ObjectId.isValid(organizationId)) {
    return res.status(400).json({
      message:
        "È necessario specificare un'organizzazione (organizationId) valida.",
    });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);

    // MODIFICA CHIAVE: Inserisci SUBITO il materiale nel DB (vuoto)
    const sourceMaterials = await db
      .collection("materials")
      .find({
        _id: { $in: sourceMaterialIds.map((id: string) => new ObjectId(id)) },
        teacherId: user._id,
      })
      .toArray();

    if (sourceMaterials.length !== sourceMaterialIds.length) {
      return res.status(404).json({
        message:
          "Uno o più materiali di origine non trovati o non autorizzati.",
      });
    }

    const sourceTitles = sourceMaterials.map((m) => m.title).join(" + ");
    const finalTitle =
      newTitle?.trim() || `${getTitlePrefix(generationType)} ${sourceTitles}`;

    // CREA IL MATERIALE VUOTO SUBITO
    const placeholderMaterial: Omit<MaterialDocument, "_id"> = {
      title: finalTitle,
      description: `Materiale in generazione da "${sourceTitles}"...`,
      teacherId: user._id,
      folderId: sourceMaterials[0].folderId,
      sharedWithClassIds: [],
      subjectId: new ObjectId(subjectId),
      organizationId: new ObjectId(organizationId),
      files: [], // File vuoti per ora
      topics: {},
      associatedTestIds: [],
      generatedFromId: new ObjectId(sourceMaterialIds[0]),
      createdAt: new Date(),
      updatedAt: new Date(),
      indexingStatus: "pending",
      // Aggiungi un flag per indicare che è in generazione
      generationStatus: "in-progress",
    };

    //  INSERISCI NEL DB SUBITO
    const result = await db
      .collection("materials")
      .insertOne(placeholderMaterial as any);
    const materialId = result.insertedId.toString();

    console.log(`[Handler] Avvio generazione immediata per ${materialId}`);

    // ✅ CHIAVE: Esegui la generazione CON AWAIT
    // Così la Lambda aspetta che finisca prima di terminare
    try {
      await completeMaterialGeneration(materialId, {
        sourceMaterialIds,
        generationType,
        language,
        focusTopics,
        finalTitle,
        userId: user._id,
      });

      console.log(
        `[Handler] Generazione completata con successo per ${materialId}`
      );

      // Recupera il materiale completato
      const completedMaterial = await db
        .collection("materials")
        .findOne({ _id: result.insertedId });

      return res.status(201).json({
        message: "Materiale generato con successo!",
        material: completedMaterial,
      });
    } catch (genError: any) {
      console.error(
        `[Handler] Errore durante la generazione di ${materialId}:`,
        genError
      );

      // Aggiorna lo stato del materiale a "failed"
      await db.collection("materials").updateOne(
        { _id: result.insertedId },
        {
          $set: {
            generationStatus: "failed",
            indexingStatus: "failed",
            updatedAt: new Date(),
          },
        }
      );

      return res.status(500).json({
        message: "Errore durante la generazione del materiale.",
        error: genError.message,
        materialId: materialId,
      });
    }
  } catch (error: any) {
    console.error("Errore in generateStudyMaterial:", error);
    return res.status(500).json({
      message: "Errore del server durante l'avvio della generazione.",
      error: error.message,
    });
  }
};
