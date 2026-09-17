export type PostgresErrorLike = {
  message?: string | undefined;
  code?: string | undefined;
};

export const isDuplicateError = (error: PostgresErrorLike): boolean =>
  error.code === "23505" ||
  /duplicate key|unique constraint/i.test(error.message ?? "");

export const isTablePermissionError = (error: PostgresErrorLike): boolean =>
  /permission denied for (table|schema|sequence)/i.test(error.message ?? "");

export const isRowLevelSecurityError = (error: PostgresErrorLike): boolean =>
  /row-level security/i.test(error.message ?? "") ||
  (error.code === "42501" && !isTablePermissionError(error));

export const errorMessage = (message: string, fallback: string): string =>
  process.env.NODE_ENV === "development" ? message : fallback;