import { NextResponse } from "next/server";
import {
  cotarFrete,
  melhorEnvioConfigurado,
  soDigitos,
  type ItemCotacao,
} from "@/lib/melhor-envio";
import { LOJA } from "@/data/loja";

/**
 * Cota o frete para o carrinho.
 *
 * Se o Melhor Envio não estiver configurado (ou falhar), devolvemos o frete
 * fixo antigo como alternativa — a loja nunca fica sem conseguir vender por
 * causa de uma cotação indisponível.
 */

export const runtime = "nodejs";

type Corpo = { cep?: string; itens?: ItemCotacao[] };

/** Frete fixo de reserva, usado quando a cotação não está disponível. */
function freteReserva(subtotalCentavos: number) {
  const gratis = subtotalCentavos >= LOJA.freteGratisAcima;
  return {
    opcoes: [
      {
        id: 0,
        nome: "Envio padrão",
        empresa: "Correios",
        preco: gratis ? 0 : LOJA.freteFixo,
        prazoDias: 8,
      },
    ],
    estimado: true,
  };
}

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
    // Ainda sem credencial: devolve a estimativa fixa em vez de falhar.
    return NextResponse.json(freteReserva(0));
  }

  try {
    const opcoes = await cotarFrete(cep, itens);

    if (opcoes.length === 0) {
      return NextResponse.json(
        {
          erro:
            "Não encontramos transporte para este CEP. Fale com a gente pelo WhatsApp que damos um jeito.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ opcoes, estimado: false });
  } catch (erro) {
    console.error("[frete] falha ao cotar:", erro);
    // Cotação fora do ar não pode impedir a venda: cai no frete fixo.
    return NextResponse.json(freteReserva(0));
  }
}
