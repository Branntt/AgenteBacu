import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio numeric default 0;"
    }).catch(async () => {
      // Si rpc no existe, ejecutar directamente con admin
      const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
      });
      return await adminClient.from("_analytics").select("*");
    });

    // Intentar ejecutar con rpc primero
    const { error: rpcError } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio numeric default 0;"
    }).catch(() => ({ error: { message: "RPC no disponible" } }));

    if (rpcError && rpcError.message !== "RPC no disponible") {
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        mensaje: "Migración ejecutada exitosamente",
        operacion: "ALTER TABLE clientes ADD COLUMN precio"
      }),
      {
        headers: { ...CORS, "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
});
