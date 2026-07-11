import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Service-role client,只能在 server 端(Route Handler / cron)使用。
// 絕不可匯入到任何 client component,service role key 一旦流到瀏覽器就等於裸奔。
export function createServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('SUPABASE_URL is not set');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
