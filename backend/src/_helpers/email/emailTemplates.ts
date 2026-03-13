/**
 * Template HTML per le notifiche email di Syllex.
 *
 * Ogni funzione ritorna un oggetto { subject, html } pronto per essere
 * passato a sendBulkEmail() o sendEmail().
 *
 * I 4 casi d'uso corrispondono alle preferenze nel profilo docente:
 * - newCommunication: nuova comunicazione pubblicata
 * - newEvent: nuovo evento creato nel calendario
 * - newTest: nuovo test assegnato agli studenti
 * - testCorrected: un test è stato corretto dal docente
 */

const BRAND_COLOR = "#4F46E5";
const BRAND_NAME = "Syllex";
const APP_URL = "https://app.syllex.org";

/**
 * Layout base condiviso da tutti i template
 */
function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR}, #7C3AED); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${BRAND_NAME}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                Questa email è stata inviata automaticamente da ${BRAND_NAME}.<br>
                Puoi modificare le tue preferenze di notifica nelle impostazioni del tuo profilo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Bottone CTA (Call To Action) condiviso
 */
function ctaButton(text: string, url: string): string {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px auto 0;">
    <tr>
      <td style="border-radius: 8px; background: linear-gradient(135deg, ${BRAND_COLOR}, #7C3AED);">
        <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #2a2a2aff; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

// ─────────────────────────────────────────────────────────
// 1. NUOVA COMUNICAZIONE
// ─────────────────────────────────────────────────────────

export interface NewCommunicationData {
  teacherName: string;
  communicationTitle: string;
  preview?: string;
}

export function newCommunicationEmail(data: NewCommunicationData) {
  const preview = data.preview
    ? `<p style="margin: 16px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 3px solid ${BRAND_COLOR};">${data.preview}</p>`
    : "";

  const html = baseLayout(`
    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">📢 Nuova Comunicazione</p>
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 22px; font-weight: 700;">${data.communicationTitle}</h2>
    <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Il docente <strong>${data.teacherName}</strong> ha pubblicato una nuova comunicazione.
    </p>
    ${preview}
    ${ctaButton("Leggi la comunicazione", APP_URL + "/comunicazioni")}
  `);

  return {
    subject: `📢 Nuova comunicazione: ${data.communicationTitle}`,
    html,
  };
}

// ─────────────────────────────────────────────────────────
// 2. NUOVO EVENTO
// ─────────────────────────────────────────────────────────

export interface NewEventData {
  teacherName: string;
  eventTitle: string;
  eventDate: string;  // es. "15 Marzo 2026"
  eventTime?: string; // es. "09:00"
}

export function newEventEmail(data: NewEventData) {
  const timeInfo = data.eventTime
    ? `<tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🕐 Orario</td>
        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.eventTime}</td>
       </tr>`
    : "";

  const html = baseLayout(`
    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">📅 Nuovo Evento</p>
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 22px; font-weight: 700;">${data.eventTitle}</h2>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
      Il docente <strong>${data.teacherName}</strong> ha aggiunto un nuovo evento al calendario.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📅 Data</td>
        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.eventDate}</td>
      </tr>
      ${timeInfo}
    </table>
    ${ctaButton("Vedi il calendario", APP_URL + "/calendario")}
  `);

  return {
    subject: `📅 Nuovo evento: ${data.eventTitle}`,
    html,
  };
}

// ─────────────────────────────────────────────────────────
// 3. NUOVO TEST CREATO
// ─────────────────────────────────────────────────────────

export interface NewTestData {
  teacherName: string;
  testTitle: string;
  subjectName: string;
  questionCount?: number;
}

export function newTestEmail(data: NewTestData) {
  const questionsInfo = data.questionCount
    ? `<tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📝 Domande</td>
        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.questionCount}</td>
       </tr>`
    : "";

  const html = baseLayout(`
    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">📝 Nuovo Test</p>
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 22px; font-weight: 700;">${data.testTitle}</h2>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
      Il docente <strong>${data.teacherName}</strong> ha creato un nuovo test per la materia <strong>${data.subjectName}</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📚 Materia</td>
        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.subjectName}</td>
      </tr>
      ${questionsInfo}
    </table>
    ${ctaButton("Vai al test", APP_URL + "/test")}
  `);

  return {
    subject: `📝 Nuovo test: ${data.testTitle} — ${data.subjectName}`,
    html,
  };
}

// ─────────────────────────────────────────────────────────
// 4. TEST CORRETTO
// ─────────────────────────────────────────────────────────

export interface TestCorrectedData {
  teacherName: string;
  testTitle: string;
  subjectName: string;
  score?: string; // es. "8/10" o "85%"
}

export function testCorrectedEmail(data: TestCorrectedData) {
  const scoreInfo = data.score
    ? `<div style="margin: 20px 0; text-align: center;">
        <span style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, ${BRAND_COLOR}, #7C3AED); color: #2e2b2bff; font-size: 24px; font-weight: 700; border-radius: 12px; letter-spacing: 0.5px;">
          ${data.score}
        </span>
        <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">Il tuo punteggio</p>
       </div>`
    : "";

  const html = baseLayout(`
    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">✅ Test Corretto</p>
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 22px; font-weight: 700;">${data.testTitle}</h2>
    <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
      Il docente <strong>${data.teacherName}</strong> ha corretto il tuo test di <strong>${data.subjectName}</strong>.
    </p>
    ${scoreInfo}
    ${ctaButton("Vedi i risultati", APP_URL + "/test")}
  `);

  return {
    subject: `✅ Test corretto: ${data.testTitle} — ${data.subjectName}`,
    html,
  };
}
