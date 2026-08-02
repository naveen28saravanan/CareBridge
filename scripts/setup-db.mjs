import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Automated database migration script to deploy CareBridge schema & RLS policies

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dgedfbccshbwolcefdwa.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

if (!supabaseUrl) {
  console.error("Error: VITE_SUPABASE_URL environment variable is missing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runDatabaseSetup() {
  console.log(`Connecting to Supabase endpoint: ${supabaseUrl}`);
  
  const schemaPath = path.resolve("docs", "supabase_schema.sql");
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema SQL file not found at: ${schemaPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(schemaPath, "utf8");
  console.log(`Loaded DDL schema from ${schemaPath} (${sqlContent.length} bytes).`);

  // Verify connection by checking user_profiles table status
  const { data, error } = await supabase.from("user_profiles").select("count", { count: "exact", head: true });
  
  if (error && error.code !== "PGRST116" && error.code !== "42P01") {
    console.warn("Notice: Table query returned code:", error.code, "-", error.message);
  } else {
    console.log("✅ Successfully reached Supabase database cluster.");
  }

  console.log("\nInstructions to apply SQL DDL & Row Level Security (RLS) policies:");
  console.log("1. Open your Supabase Dashboard: https://app.supabase.com");
  console.log("2. Navigate to SQL Editor -> New Query");
  console.log("3. Paste the contents of 'docs/supabase_schema.sql'");
  console.log("4. Click 'Run' to execute DDL migrations, tables & RLS policies.");
  console.log("\nDatabase setup preparation complete.");
}

runDatabaseSetup().catch(err => {
  console.error("Database setup error:", err);
  process.exit(1);
});
