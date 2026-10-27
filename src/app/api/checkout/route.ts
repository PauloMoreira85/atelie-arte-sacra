import { NextResponse } from "next/server";
import { criarCheckout, asaasConfigurado, type ItemCheckout } from "@/lib/asaas";
import { listarProdutos } from "@/lib/catalogo";
import { cotarFrete, melhorEnvioConfigurado } from "@/lib/melhor-envio";
import { LOJA } from "@/data/loja";
import { db, supabaseConfigurado } from "@/lib/supabase";

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
  /** UTMs e IDs de clique guardados no browser (lib/rastreamento). */
  origem?: Record<string, unknown>;
};

/** Só estes campos de origem são aceitos; o resto do objeto é descartado. */
const CAMPOS_ORIGEM = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "pagina_entrada",
  "capturada_em",
] as const;

function limparOrigem(bruta: unknown) {
  if (!bruta || typeof bruta !== "object") return null;
  const origem: Partial<Record<(typeof CAMPOS_ORIGEM)[number], string>> = {};
  for (const campo of CAMPOS_ORIGEM) {
    const v = (bruta as Record<string, unknown>)[campo];
    if (typeof v === "string" && v.trim()) origem[campo] = v.trim().slice(0, 200);
  }
  return Object.keys(origem).length > 0 ? origem : null;
}

/**
 * Grava de qual anúncio/campanha veio o pedido, para cruzar com o extrato da
 * Asaas pela referência. Nunca derruba a venda: se a tabela ainda não existe
 * (veja criar-pedidos-origem.sql) ou o banco falhar, só registra no log.
 */
async function registrarOrigem(
  referencia: string,
  valorCentavos: number,
  origem: ReturnType<typeof limparOrigem>,
) {
  if (!origem) return;
  console.info("[checkout] origem do pedido", referencia, origem);
  if (!supabaseConfigurado()) return;

  const { capturada_em, ...campos } = origem;
  try {
    const { error } = await db().from("pedidos_origem").insert({
      referencia,
      valor_centavos: valorCentavos,
      ...campos,
      origem_capturada_em: capturada_em ?? null,
    });
    if (error) console.warn("[checkout] não gravou a origem:", error.message);
  } catch (erro) {
    console.warn("[checkout] não gravou a origem:", erro);
  }
}

/** Uma peça do pedido, do jeito que vai para a tabela pedido_itens. */
type ItemGravado = {
  produto_slug: string;
  produto_nome: string;
  acabamento: string;
  quantidade: number;
  preco_centavos: number;
  ncm: string;
};

/**
 * Grava o pedido e seus itens. É o único registro PRÓPRIO da venda: sem ele
 * só existe o extrato da Asaas, que diz quanto entrou mas não o que saiu.
 *
 * A PCS Moreira é ME, e ME emite nota em toda venda — então o que está aqui
 * é o que vai virar NF-e depois que o pagamento confirmar.
 *
 * Nunca derruba a venda: se a tabela ainda não existe (veja criar-pedidos.sql)
 * ou o banco falhar, o cliente paga do mesmo jeito e o erro fica no log. Um
 * pedido sem registro se resolve à mão; uma venda perdida, não.
 */
async function registrarPedido(pedido: {
  referencia: string;
  subtotalCentavos: number;
  freteCentavos: number;
  cliente: { nome: string; email: string; telefone: string; cpfCnpj: string };
  frete: { servico: string | null; prazoDias: number | null };
  itens: ItemGravado[];
}) {
  if (!supabaseConfigurado()) return;

  try {
    const { error: erroPedido } = await db().from("pedidos").insert({
      referencia: pedido.referencia,
      status: "aberto",
      subtotal_centavos: pedido.subtotalCentavos,
      frete_centavos: pedido.freteCentavos,
      total_centavos: pedido.subtotalCentavos + pedido.freteCentavos,
      cliente_nome: pedido.cliente.nome,
      cliente_email: pedido.cliente.email,
      cliente_telefone: pedido.cliente.telefone,
      cliente_cpf_cnpj: pedido.cliente.cpfCnpj,
      frete_servico: pedido.frete.servico,
      frete_prazo_dias: pedido.frete.prazoDias,
    });

    if (erroPedido) {
      console.warn("[checkout] não gravou o pedido:", erroPedido.message);
      return;
    }

    // Só insere os itens depois que o pedido existe: a chave estrangeira os
    // rejeitaria, e item órfão não ajuda ninguém.
    const { error: erroItens } = await db()
      .from("pedido_itens")
      .insert(pedido.itens.map((i) => ({ referencia: pedido.referencia, ...i })));

    if (erroItens) {
      console.warn("[checkout] não gravou os itens:", erroItens.message);
    }
  } catch (erro) {
    console.warn("[checkout] não gravou o pedido:", erro);
  }
}

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
  // Os mesmos itens, do jeito que vão para o nosso banco. Montados aqui
  // dentro do loop porque é onde o produto já foi validado contra o catálogo.
  const itensGravados: ItemGravado[] = [];
  let subtotalCentavos = 0;
  const catalogo = await listarProdutos();

  for (const item of itens) {
    const produto = catalogo.find((p) => p.slug === item?.slug);
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
      // A conta Asaas é compartilhada com outras lojas do mesmo CNPJ, então
      // a descrição diz de qual site veio a venda. Junto com a referência
      // externa (AAS-...), é isso que permite separar o extrato depois.
      description: `${LOJA.nome} · Acabamento: ${acabamento}`,
      quantity: quantidade,
      value: produto.preco / 100, // Asaas espera reais
    });

    itensGravados.push({
      produto_slug: produto.slug,
      produto_nome: produto.nome,
      acabamento,
      quantidade,
      // Preço do momento da venda. Se a peça mudar de preço depois, a nota
      // tem que sair com o que o cliente realmente pagou.
      preco_centavos: produto.preco,
      ncm: LOJA.fiscal.ncmPadrao,
    });
  }

  // ── Frete ─────────────────────────────────────────────────────────────────
  // Mesma regra dos preços: o browser diz QUAL serviço quer e para qual CEP,
  // mas o VALOR é recotado aqui. Aceitar o preço do cliente permitiria pagar
  // R$ 1,00 de SEDEX.
  let freteCentavos = 0;
  let descricaoFrete = "Envio para todo o Brasil";
  // Guardados para o nosso registro do pedido: o prazo é o que você promete
  // ao cliente, e é por esse nome que a etiqueta é comprada no Melhor Envio.
  // Ficam nulos quando o pedido passa do valor de frete grátis: aí não há
  // serviço escolhido. Nulo e não "" para não confundir com falha de gravação.
  let servicoFrete: string | null = null;
  let prazoFrete: number | null = null;

  if (subtotalCentavos < LOJA.freteGratisAcima) {
    const cepEntrega = soDigitos(corpo?.frete?.cep ?? "");
    const servicoId = Number(corpo?.frete?.servicoId);

    // Sem CEP não há como cobrar frete — e cobrar um valor chutado sairia do
    // bolso da loja, já que o frete real vai de R$ 19 a mais de R$ 100.
    if (cepEntrega.length !== 8 || !melhorEnvioConfigurado()) {
      return NextResponse.json(
        {
          erro: "Calcule o frete antes de finalizar o pedido.",
          codigo: "frete_nao_calculado",
        },
        { status: 400 },
      );
    }

    try {
      const opcoes = await cotarFrete(
        cepEntrega,
        itens.map((i) => ({ slug: i.slug, quantidade: Number(i.quantidade) })),
      );
      const escolhida = opcoes.find((o) => o.id === servicoId) ?? opcoes[0];

      if (!escolhida) {
        return NextResponse.json(
          {
            erro:
              "Não há entrega disponível para este CEP. Fale com a gente pelo WhatsApp que combinamos o envio.",
            codigo: "sem_cobertura",
          },
          { status: 422 },
        );
      }

      freteCentavos = escolhida.preco;
      // Com a transportadora no nome: é o que o cliente leu no carrinho, e é
      // por essa descrição que você identifica o envio na hora de comprar a
      // etiqueta no Melhor Envio.
      const servico = escolhida.empresa
        ? `${escolhida.empresa} ${escolhida.nome}`
        : escolhida.nome;
      descricaoFrete = `${servico} — até ${escolhida.prazoDias} dias úteis após a produção`;
      servicoFrete = servico;
      prazoFrete = escolhida.prazoDias;
    } catch (erro) {
      // Preferimos barrar a venda a cobrar um frete inventado: o prejuízo de
      // um envio mal cobrado é maior que o de um pedido adiado por minutos.
      console.error("[checkout] falha ao recotar frete:", erro);
      return NextResponse.json(
        {
          erro:
            "Não conseguimos confirmar o frete agora. Tente de novo em instantes ou finalize pelo WhatsApp.",
          codigo: "falha_frete",
        },
        { status: 502 },
      );
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

  // Usa a origem real da requisição para os retornos. Em localhost a Asaas
  // rejeita as URLs de callback ("campo successUrl é inválido"), então
  // caímos no domínio de produção — o fluxo de teste local funciona e em
  // produção a origem já é a correta.
  const origemReq = new URL(request.url).origin;
  const origem = /localhost|127\.0\.0\.1/.test(origemReq)
    ? LOJA.url
    : origemReq;

  try {
    const checkout = await criarCheckout({
      itens: itensCheckout,
      referenciaExterna: referencia,
      cliente: { name: nome, email, phone: telefone, cpfCnpj },
      comEntrega: freteCentavos > 0,
      urls: {
        sucesso: `${origem}/pedido/confirmado?ref=${referencia}`,
        cancelado: `${origem}/carrinho?status=cancelado`,
        expirado: `${origem}/carrinho?status=expirado`,
      },
      parcelasMax: LOJA.parcelasMax,
    });

    const totalCentavos = subtotalCentavos + freteCentavos;

    // Depois de criar na Asaas: só registramos pedido que o cliente de fato
    // conseguiu abrir. Os dois gravam em paralelo porque nenhum depende do
    // outro, e nenhum dos dois derruba a venda se falhar.
    await Promise.all([
      registrarPedido({
        referencia,
        subtotalCentavos,
        freteCentavos,
        cliente: { nome, email, telefone, cpfCnpj },
        frete: { servico: servicoFrete, prazoDias: prazoFrete },
        itens: itensGravados,
      }),
      registrarOrigem(referencia, totalCentavos, limparOrigem(corpo.origem)),
    ]);

    // valor/frete voltam para o browser medir a compra com o total que a
    // Asaas vai cobrar (o frete foi recotado aqui).
    return NextResponse.json({
      link: checkout.link,
      referencia,
      valor: totalCentavos / 100,
      frete: freteCentavos / 100,
    });
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
