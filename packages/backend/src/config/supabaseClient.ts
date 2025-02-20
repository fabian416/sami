import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";


const SUPABASE_URL = ENVIRONMENT === "production"
  ? process.env.SUPABASE_URL_PRODUCTION
  : process.env.SUPABASE_URL_DEVELOPMENT;

const SUPABASE_KEY = ENVIRONMENT === "production"
  ? process.env.SUPABASE_SECRET_KEY_PRODUCTION
  : process.env.SUPABASE_SECRET_KEY_DEVELOPMENT;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase URL or Key");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;
