import { NextResponse } from "next/server";
import { usuarioAtual } from "@/lib/painel-auth";

/**
 * Diz se quem está pedindo tem sessão de painel aberta.
 *
 * Existe para a tarja do topo poder ser consultada pelo browser, em vez de
 * no servidor: ler o cookie durante a renderização tornaria TODAS as páginas
 * do site dinâmicas, e a loja perderia o cache estático por causa de uma
 * barra que quase nenhum visitante vê.
 *
 * Não devolve nada sensível — só o primeiro nome de quem está logado.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const usuario = await usuarioAtual().catch(() => null);

  return NextResponse.json(
    usuario ? { logado: true, nome: usuario.nome } : { logado: false },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
