import { neon } from "@neondatabase/serverless";
import type { AgencyState } from "./types";

const ROW_ID = "default";

function connectionString(): string | undefined {
  const u = process.env.DATABASE_URL?.trim();
  return u || undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(connectionString());
}

let schemaReady: Promise<void> | null = null;

function getSql() {
  const url = connectionString();
  if (!url) return null;
  return neon(url);
}

async function ensureTable(sql: NonNullable<ReturnType<typeof getSql>>): Promise<void> {
  schemaReady ??= sql
    .query(
      `CREATE TABLE IF NOT EXISTS agency_state (
        id text PRIMARY KEY,
        payload jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`
    )
    .then(() => undefined);
  await schemaReady;
}

/** Satır yoksa null; parse hatasında fırlatır. */
export async function readAgencyPayloadFromDb(): Promise<Partial<AgencyState> | null> {
  const sql = getSql();
  if (!sql) return null;

  await ensureTable(sql);
  const rows = (await sql.query(`SELECT payload FROM agency_state WHERE id = $1`, [
    ROW_ID,
  ])) as { payload: unknown }[];

  if (!rows?.length) return null;

  const payload = rows[0].payload;
  if (payload == null) return null;
  if (typeof payload === "string") return JSON.parse(payload) as Partial<AgencyState>;
  return payload as Partial<AgencyState>;
}

export async function writeAgencyPayloadToDb(state: AgencyState): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL tanımlı değil");

  await ensureTable(sql);
  const json = JSON.stringify(state);
  await sql.query(
    `INSERT INTO agency_state (id, payload)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       payload = EXCLUDED.payload,
       updated_at = now()`,
    [ROW_ID, json]
  );
}
