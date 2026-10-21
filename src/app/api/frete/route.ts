import { NextResponse } from "next/server";
import {
  cotarFrete,
  melhorEnvioConfigurado,
  soDigitos,
  type ItemCotacao,
} from "@/lib/melhor-envio";

/**
 * Cota o frete para o carrinho.
 *
 * Se a cotação não estiver disponível, NÃO inventamos um valor fixo: o frete
 * real varia de R$ 19 (mesma cidade) a R$ 100 (outro estado), e qualquer
 * palpite erraria para um dos lados — cobrando demais de quem mora perto ou
 * saindo do bolso da loja em quem mora longe. Em vez disso pedimos para
 * combinar pelo WhatsApp, que é raro e resolve na conversa.
 */

export const runtime = "nodejs";

type Corpo = { cep?: string; itens?: ItemCotacao[] };

/** Resposta usada quando não dá para cotar. */
const combinarPorWhatsApp = (motivo: string) =>
  NextResponse.json(
    {
      erro:
        "Não conseguimos calcular o frete para este CEP agora. Fale com a gente pelo WhatsApp que combinamos o envio.",
      combinarWhatsApp: true,
      motivo,
    },
    { status: 422 },
  );

export async function POST(request: Request) {
  let corpo: Corpo;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const cep = soDigitos(corpo?.cep ?? "");
  const itens = Array.isArray(corpo?.itens) ? corpo.itens : [];

  if (cep.length !== 8) {
    return NextResponse.json(
      { erro: "Informe um CEP válido, com 8 dígitos." },
      { status: 400 },
    );
  }
  if (itens.length === 0) {
    return NextResponse.json({ erro: "Carrinho vazio." }, { status: 400 });
  }

  if (!melhorEnvioConfigurado()) {
    return combinarPorWhatsApp("sem_credencial");
  }

  try {
    const opcoes = await cotarFrete(cep, itens);
    if (opcoes.length === 0) {
      // CEP sem cobertura das transportadoras (acontece em área remota).
      return combinarPorWhatsApp("sem_cobertura");
    }
    return NextResponse.json({ opcoes, estimado: false });
  } catch (erro) {
    console.error("[frete] falha ao cotar:", erro);
    return combinarPorWhatsApp("falha_cotacao");
  }
}
