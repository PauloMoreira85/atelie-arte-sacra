import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Conexão com o Supabase. Roda SOMENTE no servidor.
 *
 * Usamos a service role, que ignora o RLS — por isso este arquivo tem
 * "server-only": se alguém importar sem querer num componente de cliente,
 * o build quebra em vez de vazar a chave para o browser.
 */

let cliente: SupabaseClient | null = null;

export function supabaseConfigurado() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function db() {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !chave) {
    throw new Error(
      "Supabase não configurado. Veja COMO-EDITAR.md > Painel de administração.",
    );
  }

  cliente = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}
