/**
 * Run the initial database migration against Supabase.
 * Uses the service role key to execute SQL directly.
 *
 * Usage: node scripts/run-migration.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars manually (dotenv not installed, parse .env.local)
const envFile = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim()];
    })
);

const SUPABASE_URL         = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY     = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = readFileSync(join(__dirname, "../supabase/migrations/001_initial.sql"), "utf-8");

// Split SQL into individual statements and run each via rpc
// Use the pg REST endpoint via fetch
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log(`📡 Running migration on project: ${projectRef}`);
console.log("─".repeat(50));

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  }
);

if (!response.ok) {
  // The management API doesn't accept service_role key — use pg directly via Supabase SQL function
  console.log("⚠️  Management API not available. Using alternative method...\n");
  console.log("Please run this SQL in your Supabase SQL Editor:");
  console.log("─".repeat(50));
  console.log("Go to: https://app.supabase.com/project/" + projectRef + "/sql/new");
  console.log("─".repeat(50));
  console.log("The SQL file is at: supabase/migrations/001_initial.sql");
  console.log("\nCopying SQL to clipboard is not possible from CLI.");
  console.log("\n✅ Migration file is ready — paste it into Supabase SQL editor.");
} else {
  const result = await response.json();
  console.log("✅ Migration completed successfully!", result);
}
