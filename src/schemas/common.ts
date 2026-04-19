import { z } from "zod";

/**
 * Shared primitives used across schemas. ISO datetime strings are used for
 * all timestamps (not Date objects) because the canonical data lives in
 * JSON files and round-trips through the file system; Zod coerces on read.
 */

export const isoDate = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "expected YYYY-MM-DD"
);

export const isoDateTime = z.iso.datetime({ offset: true });

export const nullableIsoDateTime = isoDateTime.nullable();

export const idString = z.string().min(1);
