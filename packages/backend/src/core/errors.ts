/**
 * Centralized application errors with typed codes and safe serialization
 * for HTTP or WebSocket responses.
 */

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "VALIDATION"
  | "INTERNAL"
  // domain-specific examples
  | "GAME_JOIN_FAILED"
  | "CAST_VOTE_FAILED"
  | "WALLET_LINK_FAILED";

/**
 * Maps a generic error code to an HTTP status. Used as a default
 * when emitting HTTP responses; also useful as a severity hint for WS.
 */
const mapCodeToStatus = (code: ErrorCode): number => {
  switch (code) {
    case "BAD_REQUEST":
    case "VALIDATION":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "RATE_LIMIT":
      return 429;
    default:
      return 500; // INTERNAL or unknown codes
  }
};

/**
 * AppError carries a typed error code, a default HTTP status, and optional
 * non-sensitive details for observability. It also supports a public-facing
 * message different from the internal one.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly safeMessage?: string;

  constructor(
    code: ErrorCode,
    message: string,
    opts?: {
      status?: number;
      details?: Record<string, unknown>;
      safeMessage?: string;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = opts?.status ?? mapCodeToStatus(code);
    this.details = opts?.details;
    this.safeMessage = opts?.safeMessage;
    if (opts?.cause) {
      // preserve original cause if available (Node 16+ supports Error.cause)
      (this as any).cause = opts.cause;
    }
    Error.captureStackTrace?.(this, AppError);
  }
}

/**
 * Produces a safe, minimal payload to send back to clients (HTTP/WS).
 * Never includes stack traces or internal details.
 */
export const toPublicError = (err: unknown) => {
  if (err instanceof AppError) {
    return {
      code: err.code,
      message: err.safeMessage ?? err.message,
      status: err.status,
    };
  }
  return {
    code: "INTERNAL" as const,
    message: "Unexpected error",
    status: 500,
  };
};

/**
 * Converts validation library errors (e.g., Zod) into a standardized AppError.
 */
export const asValidationError = (
  err: unknown,
  details?: Record<string, unknown>
) =>
  new AppError("VALIDATION", "Invalid payload", {
    status: 400,
    details,
    cause: err,
  });

/**
 * Type guard for AppError.
 */
export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
