export interface NavigablePage {
  key: string;
  path: string;
  label: string;
  description: string;
}

export const SYLLEX_SITEMAP: Record<string, NavigablePage[]> = {
  teacher: [
    { key: 'DASHBOARD', path: '/t/dashboard', label: 'Vai alla Dashboard', description: 'Panoramica principale delle tue attività e classi.' },
    { key: 'BANCA', path: '/t/banca', label: 'Apri Banca Domande', description: 'Gestione, creazione e modifica delle domande per i test.' },
    { key: 'CLASSI', path: '/t/classi', label: 'Gestisci le tue Classi', description: 'Elenco completo delle tue classi e dei relativi studenti.' },
    { key: 'RISORSE', path: '/t/risorse', label: 'Vedi i Materiali', description: 'Accesso a documenti, slide e risorse didattiche caricate.' },
    { key: 'TESTS', path: '/t/tests', label: 'Vai ai Test', description: 'Elenco, monitoraggio e creazione delle verifiche scolastiche.' },
    { key: 'COMUNICAZIONI', path: '/t/comunicazioni', label: 'Leggi le Comunicazioni', description: 'Centro messaggi per scambiare avvisi e comunicazioni con gli studenti.' },
    { key: 'PROFILO', path: '/t/profilo', label: 'Il tuo Profilo', description: 'Gestione delle tue informazioni personali e preferenze account.' },
    { key: 'LAB_AI', path: '/t/laboratorio-ai', label: 'Laboratorio AI', description: 'Strumenti avanzati di intelligenza artificiale per il supporto alla didattica.' },
    { key: 'EVENTI', path: '/t/eventi', label: 'Guarda il Calendario', description: 'Calendario scolastico, scadenze, eventi e appuntamenti programmati.' }
  ],
  student: [
    { key: 'DASHBOARD', path: '/s/dashboard', label: 'Vai alla Dashboard', description: 'La tua panoramica sui progressi e sulle lezioni recenti.' },
    { key: 'TESTS', path: '/s/tests', label: 'I tuoi Test', description: 'Elenco dei test da svolgere, in corso o già completati.' },
    { key: 'CLASSI', path: '/s/classi', label: 'Le tue Classi', description: 'Dettagli sulle classi che frequenti e i tuoi compagni.' },
    { key: 'RISORSE', path: '/s/risorse', label: 'Materiali di Studio', description: 'Documenti e materiali caricati dai tuoi docenti per lo studio.' },
    { key: 'PROFILO', path: '/s/profilo', label: 'Il tuo Profilo', description: 'Gestione delle tue impostazioni e dei tuoi dati personali.' },
    { key: 'COMUNICAZIONI', path: '/s/comunicazioni', label: 'Comunicazioni', description: 'Ricevi avvisi e messaggi importanti dai tuoi docenti.' },
    { key: 'AUTO_EVALUATION', path: '/s/auto-evaluation/create', label: 'Crea Auto-Valutazione', description: 'Genera nuovi test ed esercitazioni per studiare autonomamente con l\'AI.' }
  ],
  admin: []
};

export function getSitemapForRole(role: "student" | "teacher" | "admin"): NavigablePage[] {
  return SYLLEX_SITEMAP[role] || [];
}
