/** Middleware Zod : valide body / query / params selon le schéma fourni. */
export const valider = (schema, source = 'body') => (req, res, next) => {
  const resultat = schema.safeParse(req[source]);
  if (!resultat.success) {
    return res.status(422).json({ success: false, error: { code: 'VALIDATION', message: 'Données invalides', details: resultat.error.flatten().fieldErrors } });
  }
  req[source] = resultat.data;
  next();
};
