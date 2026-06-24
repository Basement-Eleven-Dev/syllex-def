/**
 * Costruisce il filtro Mongo {$gte,$lte} su `startedAt` dai parametri from/to.
 *
 * Gli <input type="date"> del frontend mandano date "solo giorno" (YYYY-MM-DD).
 * Parsate da `new Date()` diventano mezzanotte UTC: senza accorgimenti, un
 * intervallo "dal 24 al 24" produrrebbe `$lte 24T00:00` → nessun evento del 24.
 *
 * Qui le rendiamo INCLUSIVE: `from` parte a inizio giornata, `to` arriva a fine
 * giornata, così "dal 24 al 24" cattura tutti gli eventi del 24. I valori che
 * includono già un orario (ISO completo) vengono usati tali e quali.
 */
const isDateOnly = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s.trim());

export const buildStartedAtRange = (
  from?: string | null,
  to?: string | null,
): { $gte?: Date; $lte?: Date } | undefined => {
  if (!from && !to) return undefined;
  const range: { $gte?: Date; $lte?: Date } = {};
  if (from) {
    range.$gte = new Date(isDateOnly(from) ? `${from}T00:00:00.000Z` : from);
  }
  if (to) {
    range.$lte = new Date(isDateOnly(to) ? `${to}T23:59:59.999Z` : to);
  }
  return range;
};
