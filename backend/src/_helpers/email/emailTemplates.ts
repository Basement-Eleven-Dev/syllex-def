/**
 * Template HTML per le notifiche email di Syllex.
 *
 * Ogni funzione ritorna un oggetto { subject, html } pronto per essere
 * passato a sendBulkEmail() o sendEmail().
 */

const BRAND_COLOR = "#4F46E5";
const SECONDARY_COLOR = "#7C3AED";
const BRAND_NAME = "Syllex";
const APP_URL = "https://app.syllex.org";

/**
 * Layout base con estetica premium:
 * - Font Outfit (Google Fonts)
 * - Design a card con ombre morbide
 * - Gradienti e look moderno
 */
function baseLayout(content: string, preheader: string = ""): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
    body { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <span style="display: none; max-height: 0px; overflow: hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
          <!-- Header Accent -->
          <tr>
            <td style="height: 6px; background-color: ${BRAND_COLOR}; background: linear-gradient(90deg, ${BRAND_COLOR}, ${SECONDARY_COLOR});"></td>
          </tr>
          <!-- Logo/Brand Area -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: ${BRAND_COLOR}; font-size: 28px; font-weight: 700; letter-spacing: -1px;">${BRAND_NAME}</h1>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer Area -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f1f5f9; text-align: center;">
              <p style="margin: 0 0 12px; color: #475569; font-size: 13px; line-height: 1.5;">
                Ricevi questa email perché sei uno studente registrato su <strong>${BRAND_NAME}</strong>.
              </p>
              <div style="margin-bottom: 12px;">
                <a href="${APP_URL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 13px; font-weight: 600;">Dashboard</a>
                <span style="color: #cbd5e1; margin: 0 8px;">•</span>
                <a href="${APP_URL}/profilo" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 13px; font-weight: 600;">Impostazioni</a>
              </div>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. Tutti i diritti riservati.
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
 * Bottone CTA Premium
 */
function ctaButton(text: string, url: string): string {
  return `
  <div style="margin: 32px 0 0; text-align: center;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="20%" stroke="f" fillcolor="${BRAND_COLOR}">
      <w:anchorlock/>
      <center>
    <![endif]-->
    <a href="${url}" target="_blank" style="background-color: ${BRAND_COLOR}; background: linear-gradient(135deg, ${BRAND_COLOR}, ${SECONDARY_COLOR}); border-radius: 12px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 700; line-height: 50px; text-align: center; text-decoration: none; width: 240px; -webkit-text-size-adjust: none; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">
      ${text}
    </a>
    <!--[if mso]>
      </center>
    </v:roundrect>
    <![endif]-->
  </div>`;
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
    ? `<div style="margin: 24px 0; padding: 24px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
         <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6; font-style: italic;">"${data.preview}"</p>
       </div>`
    : "";

  const html = baseLayout(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background-color: #e0e7ff; color: ${BRAND_COLOR}; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📢 Comunicazione</span>
    </div>
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 700; text-align: center; line-height: 1.3;">${data.communicationTitle}</h2>
    <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
      Il docente <strong>${data.teacherName}</strong> ha condiviso un nuovo aggiornamento con la classe.
    </p>
    ${preview}
    ${ctaButton("Leggi tutto", APP_URL + "/comunicazioni")}
  `, `Nuova comunicazione da ${data.teacherName}`);

  return {
    subject: `📢 ${data.communicationTitle}`,
    html,
  };
}

// ─────────────────────────────────────────────────────────
// 2. NUOVO EVENTO
// ─────────────────────────────────────────────────────────

export interface NewEventData {
  teacherName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
}

export function newEventEmail(data: NewEventData) {
  const html = baseLayout(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background-color: #fdf2f8; color: #db2777; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📅 Calendario</span>
    </div>
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 700; text-align: center;">${data.eventTitle}</h2>
    <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
      Un nuovo evento è stato aggiunto dal docente <strong>${data.teacherName}</strong>.
    </p>
    
    <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-bottom: 12px;">
            <div style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Quando</div>
            <div style="color: #0f172a; font-size: 16px; font-weight: 700; margin-top: 4px;">${data.eventDate}${data.eventTime ? ' ore ' + data.eventTime : ''}</div>
          </td>
        </tr>
      </table>
    </div>
    
    ${ctaButton("Apri Calendario", APP_URL + "/calendario")}
  `, `Nuovo evento: ${data.eventTitle}`);

  return {
    subject: `📅 ${data.eventTitle}`,
    html,
  };
}

// ─────────────────────────────────────────────────────────
// 3. NUOVO TEST
// ─────────────────────────────────────────────────────────

export interface NewTestData {
  teacherName: string;
  testTitle: string;
  subjectName: string;
  questionCount?: number;
}

export function newTestEmail(data: NewTestData) {
  const html = baseLayout(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background-color: #fefce8; color: #ca8a04; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📝 Nuovo Test</span>
    </div>
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 700; text-align: center;">${data.testTitle}</h2>
    <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
      Preparati! <strong>${data.teacherName}</strong> ha assegnato un nuovo test di <strong>${data.subjectName}</strong>.
    </p>
    
    <div style="background-color: #fffbeb; border-radius: 16px; padding: 24px; border: 1px solid #fef3c7; text-align: center;">
      <div style="color: #92400e; font-size: 13px; font-weight: 600; text-transform: uppercase;">Materia</div>
      <div style="color: #451a03; font-size: 18px; font-weight: 700; margin-top: 4px;">${data.subjectName}</div>
      ${data.questionCount ? `<div style="color: #b45309; font-size: 14px; margin-top: 8px;">${data.questionCount} domande previste</div>` : ''}
    </div>
    
    ${ctaButton("Inizia il Test", APP_URL + "/test")}
  `, `Nuovo test di ${data.subjectName}`);

  return {
    subject: `📝 Nuovo test: ${data.testTitle}`,
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
  score?: string;
}

export function testCorrectedEmail(data: TestCorrectedData) {
  const scoreBadge = data.score
    ? `<div style="margin: 24px 0; text-align: center;">
         <div style="display: inline-block;">
           <div style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Risultato</div>
           <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
             <tr>
               <td style="background-color: ${BRAND_COLOR}; background: linear-gradient(135deg, ${BRAND_COLOR}, ${SECONDARY_COLOR}); color: #ffffff; font-size: 36px; font-weight: 800; padding: 12px 32px; border-radius: 20px; box-shadow: 0 8px 16px rgba(79, 70, 229, 0.25); text-align: center;">
                 ${data.score}
               </td>
             </tr>
           </table>
         </div>
       </div>`
    : "";

  const html = baseLayout(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background-color: #f0fdf4; color: #16a34a; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">✅ Valutazione</span>
    </div>
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 700; text-align: center;">Risultati disponibili</h2>
    <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
      La tua prova di <strong>${data.subjectName}</strong> (${data.testTitle}) è stata corretta da <strong>${data.teacherName}</strong>.
    </p>
    
    ${scoreBadge}
    
    ${ctaButton("Dettagli correzione", APP_URL + "/test")}
  `, `Risultati per: ${data.testTitle}`);

  return {
    subject: `✅ Risultati Test: ${data.testTitle}`,
    html,
  };
}
