import { Context } from "aws-lambda";
import createHttpError from "http-errors";

/**
 * Super-admin = utente con ruolo "admin" e SENZA organizzazioni associate.
 * I log sono leggibili solo dal super-admin (gli admin di organizzazione no).
 */
export const isSuperAdmin = (context: Context): boolean => {
  const user = context.user;
  return (
    user?.role === "admin" &&
    (!user.organizationIds || user.organizationIds.length === 0)
  );
};

export const assertSuperAdmin = (context: Context): void => {
  if (!isSuperAdmin(context)) {
    throw createHttpError(403, "Accesso consentito solo al super-admin");
  }
};
