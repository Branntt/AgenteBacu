import { supabase } from './supabaseClient.js';

export async function generarIdea({ marca, modo, tema, formato }) {
  const { data, error } = await supabase.functions.invoke('generar-idea', {
    body: { marca, modo, tema: tema || undefined, formato: formato || undefined }
  });
  if (error) throw error;
  return data.ideas;
}
