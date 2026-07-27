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
    const { data, error } = await supabase
      .from("deudas")
      .insert([
        {
          id: "deuda-brayan-her-fotos",
          persona: "BrayanHer",
          monto: 350000,
          direccion: "debo",
          nota: "Fotos"
        },
        {
          id: "deuda-sol-servicios",
          persona: "Sol",
          monto: 300000,
          direccion: "debo",
          nota: "Servicios"
        }
      ]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        mensaje: "Deudas insertadas exitosamente",
        deudas: ["BrayanHer: $350.000", "Sol: $300.000"],
        total: "$650.000"
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
