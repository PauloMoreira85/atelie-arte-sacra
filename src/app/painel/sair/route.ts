import { NextResponse } from "next/server";
import { sair } from "@/lib/painel-auth";

/**
 * Encerra a sessão e volta para a home.
 *
 * É uma rota (e não um botão com server action) para a tarja do topo poder
 * funcionar sendo um componente de cliente — ver o comentário em
 * BarraPainel.tsx sobre por que ela não roda no servidor.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await sair().catch(() => {});
  return NextResponse.redirect(new URL("/", request.url));
}
