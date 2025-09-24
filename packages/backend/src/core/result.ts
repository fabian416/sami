/**
 * Lightweight Result type (Ok/Err) to avoid pervasive try/catch at call sites.
 * Useful for service/domain layers and async boundaries.
 */

export type Ok<T> = { ok: true; value: T };
export type Err<E = unknown> = { ok: false; error: E };
export type Result<T, E = unknown> = Ok<T> | Err<E>;

/**
 * Creates a successful Result.
 */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/**
 * Creates a failed Result.
 */
export const err = <E = unknown>(error: E): Err<E> => ({ ok: false, error });

/**
 * Wraps a Promise into a Result. Optionally maps the thrown error
 * into a typed error value.
 */
export async function fromPromise<T, E = unknown>(
  promise: Promise<T>,
  mapError?: (e: unknown) => E
): Promise<Result<T, E | unknown>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (e) {
    return err(mapError ? mapError(e) : e);
  }
}

/**
 * Unwraps a Result, throwing if it is an Err. Prefer this at the edges
 * where throwing is acceptable (e.g., controller/handler boundary).
 */
export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (!r.ok) throw r.error;
  return r.value;
};

/**
 * Functional pattern-matching helper for Results.
 */
export const match = <T, E, A>(
  r: Result<T, E>,
  cases: { ok: (v: T) => A; err: (e: E) => A }
): A => (r.ok ? cases.ok(r.value) : cases.err(r.error));
