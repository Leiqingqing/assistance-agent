import { drizzle } from "drizzle-orm/d1";

export function getDb(binding: D1Database) {
  return drizzle(binding);
}

export type Db = ReturnType<typeof getDb>;
