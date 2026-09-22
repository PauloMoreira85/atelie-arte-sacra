import "server-only";
import { PRODUTOS } from "@/data/produtos";

/**
 * Cliente da API do Melhor Envio. Roda SOMENTE no servidor — o token nunca
 * vai ao browser.
 *
 * Usamos só a COTAÇÃO (calculate). A compra da etiqueta continua sendo feita
 * por você no painel do Melhor Envio: para o volume atual, automatizar a
 * compra traria risco (etiqueta comprada por engano custa dinheiro) sem
 * ganho real de tempo.
 *
 * Docs: https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos
 */

const SANDBOX_URL = "https://sandbox.melhorenvio.com.br";
const PRODUCAO_URL = "https://melhorenvio.com.br";

/** Serviços cotados: 1 = PAC, 2 = SEDEX, 17 = Mini Envios. */
const SERVICOS = "1,2,17";

export function melhorEnvioConfigurado() {
  return Boolean(
    process.env.MELHOR_ENVIO_TOKEN?.trim() && process.env.CEP_ORIGEM?.trim(),
  );
}

function config() {
  const token = process.env.MELHOR_ENVIO_TOKEN?.trim();
  const cepOrigem = soDigitos(process.env.CEP_ORIGEM ?? "");

  if (!token) throw new Error("MELHOR_ENVIO_TOKEN não configurado.");
  if (cepOrigem.length !== 8) {
    throw new Error("CEP_ORIGEM inválido — precisa ter 8 dígitos.");
  }

  // Sandbox é detectado pela variável; o token de sandbox não é distinguível
  // do de produção pelo formato, então aqui a escolha é explícita.
  const ehSandbox = process.env.MELHOR_ENVIO_AMBIENTE === "sandbox";

  return {
    token,
    cepOrigem,
    baseUrl: ehSandbox ? SANDBOX_URL : PRODUCAO_URL,
    ehSandbox,
  };
}

export const soDigitos = (s: string) => s.replace(/\D/g, "");

export type ItemCotacao = { slug: string; quantidade: number };

export type OpcaoFrete = {
  id: number;
  nome: string;
  empresa: string;
  /** Preço em centavos, já com as customizações da conta. */
  preco: number;
  /** Prazo de entrega em dias úteis, sem contar a produção. */
  prazoDias: number;
};

type RespostaServico = {
  id: number;
  name: string;
  company?: { name?: string };
  custom_price?: string;
  price?: string;
  custom_delivery_time?: number;
  delivery_time?: number;
  error?: string;
};

/**
 * Cota o frete para um carrinho. Devolve as opções ordenadas da mais barata
 * para a mais cara.
 */
export async function cotarFrete(
  cepDestino: string,
  itens: ItemCotacao[],
): Promise<OpcaoFrete[]> {
  const { token, cepOrigem, baseUrl } = config();

  const cep = soDigitos(cepDestino);
  if (cep.length !== 8) {
    throw new Error("CEP de destino inválido.");
  }

  // Monta a lista de produtos a partir do catálogo do servidor. O browser
  // manda só slug e quantidade — peso e medidas nunca vêm dele, senão
  // alguém poderia forjar uma caixa de 1g para pagar frete mínimo.
  const produtos = itens.flatMap((item) => {
    const p = PRODUTOS.find((x) => x.slug === item.slug);
    if (!p) return [];

    const quantidade = Math.max(1, Math.min(99, Math.trunc(item.quantidade)));

    return [{
      id: p.slug,
      width: p.envio.caixa.largura,
      height: p.envio.caixa.altura,
      length: p.envio.caixa.comprimento,
      weight: p.envio.pesoG / 1000, // a API espera quilos
      insurance_value: Number((p.preco / 100).toFixed(2)),
      quantity: quantidade,
    }];
  });

  if (produtos.length === 0) {
    throw new Error("Nenhum produto válido para cotar.");
  }

  const resposta = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      // O Melhor Envio exige User-Agent com nome do app e e-mail de contato.
      "User-Agent": `AtelieArteSacra (${process.env.EMAIL_CONTATO ?? "contato@atelieartesacra.com.br"})`,
    },
    body: JSON.stringify({
      from: { postal_code: cepOrigem },
      to: { postal_code: cep },
      products: produtos,
      options: { receipt: false, own_hand: false },
      services: SERVICOS,
    }),
    cache: "no-store",
  });

  const texto = await resposta.text();

  if (!resposta.ok) {
    throw new Error(`Melhor Envio ${resposta.status}: ${texto.slice(0, 300)}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error("Melhor Envio devolveu resposta que não é JSON.");
  }

  if (!Array.isArray(json)) {
    throw new Error("Melhor Envio devolveu formato inesperado.");
  }

  // A API devolve um item por serviço, e serviços indisponíveis para aquele
  // CEP vêm com "error" em vez de preço — filtramos esses fora.
  const opcoes = (json as RespostaServico[]).flatMap<OpcaoFrete>((s) => {
    if (s.error) return [];

    const precoTexto = s.custom_price ?? s.price;
    const preco = Number(precoTexto);
    if (!precoTexto || !Number.isFinite(preco) || preco <= 0) return [];

    const prazo = s.custom_delivery_time ?? s.delivery_time;
    if (!Number.isFinite(prazo)) return [];

    return [{
      id: s.id,
      nome: s.name,
      empresa: s.company?.name ?? "",
      preco: Math.round(preco * 100),
      prazoDias: Number(prazo),
    }];
  });

  return opcoes.sort((a, b) => a.preco - b.preco);
}
