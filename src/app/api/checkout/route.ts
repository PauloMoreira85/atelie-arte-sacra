import { NextResponse } from "next/server";
import { criarCheckout, asaasConfigurado, type ItemCheckout } from "@/lib/asaas";
import { PRODUTOS } from "@/data/produtos";
import { cotarFrete, melhorEnvioConfigurado } from "@/lib/melhor-envio";
import { LOJA } from "@/data/loja";

/**
 * Cria o checkout na Asaas e devolve o link de pagamento.
 *
 * SEGURANÇA: o browser manda apenas slug + acabamento + quantidade. Os PREÇOS
 * são sempre lidos do catálogo aqui no servidor. Se confiássemos no valor
 * enviado pelo cliente, qualquer pessoa poderia editar o payload e comprar um
 * busto por R$ 1,00.
 */

export const runtime = "nodejs";

type ItemPedido = { slug: string; acabamento: string; quantidade: number };

type CorpoPedido = {
  itens: ItemPedido[];
  cliente: { nome: string; email: string; telefone: string; cpfCnpj: string };
  /** CEP e serviço escolhidos na calculadora. O preço é recotado no servidor. */
  frete?: { cep?: string; servicoId?: number };
};

const soDigitos = (s: string) => s.replace(/\D/g, "");

/** Valida CPF (11) ou CNPJ (14) pelos dígitos verificadores. */
function documentoValido(valor: string) {
  const d = soDigitos(valor);

  if (d.length === 11) {
    if (/^(\d)\1{10}$/.test(d)) return false;
    for (const [fatorInicial, ate] of [
      [10, 9],
      [11, 10],
    ] as const) {
      let soma = 0;
      for (let i = 0; i < ate; i++) soma += Number(d[i]) * (fatorInicial - i);
      let dig = (soma * 10) % 11;
      if (dig === 10) dig = 0;
      if (dig !== Number(d[ate])) return false;
    }
    return true;
  }

  if (d.length === 14) {
    if (/^(\d)\1{13}$/.test(d)) return false;
    const calc = (ate: number) => {
      const pesos =
        ate === 12
          ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
          : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      let soma = 0;
      for (let i = 0; i < ate; i++) soma += Number(d[i]) * pesos[i];
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
  }

  return false;
}

export async function POST(request: Request) {
  if (!asaasConfigurado()) {
    return NextResponse.json(
      {
        erro:
          "O pagamento online ainda não está ativo. Fale com a gente pelo WhatsApp para finalizar o pedido.",
        codigo: "sem_credencial",
      },
      { status: 503 },
    );
  }

  let corpo: CorpoPedido;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }

  const { itens, cliente } = corpo ?? {};

  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "O carrinho está vazio." }, { status: 400 });
  }

  // ── Dados do cliente ──────────────────────────────────────────────────────
  const nome = cliente?.nome?.trim() ?? "";
  const email = cliente?.email?.trim() ?? "";
  const telefone = soDigitos(cliente?.telefone ?? "");
  const cpfCnpj = soDigitos(cliente?.cpfCnpj ?? "");

  if (nome.length < 3) {
    return NextResponse.json({ erro: "Informe seu nome completo." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  }
  if (telefone.length < 10 || telefone.length > 11) {
    return NextResponse.json(
      { erro: "Telefone inválido. Use DDD + número." },
      { status: 400 },
    );
  }
  if (!documentoValido(cpfCnpj)) {
    return NextResponse.json({ erro: "CPF ou CNPJ inválido." }, { status: 400 });
  }

  // ── Itens: preço sempre do catálogo do servidor ───────────────────────────
  const itensCheckout: ItemCheckout[] = [];
  let subtotalCentavos = 0;

  for (const item of itens) {
    const produto = PRODUTOS.find((p) => p.slug === item?.slug);
    if (!produto) {
      return NextResponse.json(
        { erro: "Um dos produtos do carrinho não está mais disponível." },
        { status: 400 },
      );
    }

    const quantidade = Number(item.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
      return NextResponse.json(
        { erro: `Quantidade inválida para ${produto.nome}.` },
        { status: 400 },
      );
    }

    // Só aceita acabamento que existe no produto — evita pedido impossível de produzir.
    const acabamento = produto.acabamentos.includes(item.acabamento)
      ? item.acabamento
      : produto.acabamentos[0];

    subtotalCentavos += produto.preco * quantidade;
    itensCheckout.push({
      name: produto.nome,
      description: `Acabamento: ${acabamento}`,
      quantity: quantidade,
      value: produto.preco / 100, // Asaas espera reais
    });
  }

  // ── Frete ─────────────────────────────────────────────────────────────────
  // Mesma regra dos preços: o browser diz QUAL serviço quer e para qual CEP,
  // mas o VALOR é recotado aqui. Aceitar o preço do cliente permitiria pagar
  // R$ 1,00 de SEDEX.
  let freteCentavos = 0;
  let descricaoFrete = "Envio para todo o Brasil";

  if (subtotalCentavos < LOJA.freteGratisAcima) {
    const cepEntrega = soDigitos(corpo?.frete?.cep ?? "");
    const servicoId = Number(corpo?.frete?.servicoId);

    if (cepEntrega.length === 8 && melhorEnvioConfigurado()) {
      try {
        const opcoes = await cotarFrete(
          cepEntrega,
          itens.map((i) => ({ slug: i.slug, quantidade: Number(i.quantidade) })),
        );
        const escolhida =
          opcoes.find((o) => o.id === servicoId) ?? opcoes[0];

        if (escolhida) {
          freteCentavos = escolhida.preco;
          descricaoFrete = `${escolhida.nome} — até ${escolhida.prazoDias} dias úteis após a produção`;
        } else {
          freteCentavos = LOJA.freteFixo;
        }
      } catch (erro) {
        // Cotação indisponível no momento do checkout: cobra o valor fixo em
        // vez de barrar a venda. A diferença é acertada no envio.
        console.error("[checkout] falha ao recotar frete:", erro);
        freteCentavos = LOJA.freteFixo;
      }
    } else {
      freteCentavos = LOJA.freteFixo;
    }
  }

  if (freteCentavos > 0) {
    itensCheckout.push({
      name: "Frete",
      description: descricaoFrete,
      quantity: 1,
      value: freteCentavos / 100,
    });
  }

  const referencia = `AAS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // Usa a origem real da requisição para os retornos, para funcionar igual em
  // localhost, preview da Vercel e domínio final.
  const origem = new URL(request.url).origin;

  try {
    const checkout = await criarCheckout({
      itens: itensCheckout,
      referenciaExterna: referencia,
      cliente: { name: nome, email, phone: telefone, cpfCnpj },
      urls: {
        sucesso: `${origem}/pedido/confirmado?ref=${referencia}`,
        cancelado: `${origem}/carrinho?status=cancelado`,
        expirado: `${origem}/carrinho?status=expirado`,
      },
      parcelasMax: 6,
    });

    return NextResponse.json({ link: checkout.link, referencia });
  } catch (erro) {
    console.error("[checkout] falha ao criar na Asaas:", erro);
    return NextResponse.json(
      {
        erro:
          "Não conseguimos abrir o pagamento agora. Tente de novo em instantes ou finalize pelo WhatsApp.",
        codigo: "falha_gateway",
      },
      { status: 502 },
    );
  }
}
