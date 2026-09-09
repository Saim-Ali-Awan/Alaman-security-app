export type PostgresErrorLike = {
  message?: string | undefined;
  code?: string | undefined;
};

export const isDuplicateError = (error: PostgresErrorLike): boolean =>
  error.code === "23505" ||
  /duplicate key|unique constraint/i.test(error.message ?? "");

export const isRowLevelSecurityError = (error: PostgresErrorLike): boolean =>
  error.code === "42501" || /row-level security/i.test(error.message ?? "");

export const errorMessage = (message: string, fallback: string): string =>
  process.env.NODE_ENV === "development" ? message : fallback;