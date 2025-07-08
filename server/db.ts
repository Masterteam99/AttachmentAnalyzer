import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;

let db: any;

// Configurazione per SQLite (sviluppo)
if (databaseUrl.startsWith('file:')) {
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  
  const sqlite = new Database(databaseUrl.replace('file:', ''));
  db = drizzle(sqlite, { schema });
} else {
  // PostgreSQL/Neon (produzione)
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-serverless');
  const ws = require("ws");
  
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: databaseUrl });
  db = drizzle(pool, { schema });
}

export { db };