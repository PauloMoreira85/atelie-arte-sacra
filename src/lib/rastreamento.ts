/**
 * Rastreamento para tráfego pago: GA4, Google Ads e Meta Pixel.
 *
 * Roda só no browser. Os scripts das ferramentas são carregados pelo layout
 * raiz (<Rastreamento />); aqui ficam a inicialização e os eventos.
 *
 * Cada ferramenta só liga se o ID dela estiver preenchido no ambiente. Sem
 * nenhum ID, todas as funções viram no-op — o site funciona igual.
 *
 * A inicialização (config do gtag e init do fbq) é feita AQUI, e não num
 * script inline do layout, para garantir que ela entra na fila antes de
 * qualquer evento. Se um efeito de componente disparasse antes do script
 * inline, o evento iria para lugar nenhum.
 */

import type { Produto } from "@/data/produtos";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID?.trim() ?? "";
const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID?.trim() ?? "";
const GADS_LABEL_COMPRA =
  process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL?.trim() ?? "";
const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";

const usaGtag = Boolean(GA4_ID || GADS_ID);
const usaMeta = Boolean(META_PIXEL_ID);

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    _fbq?: Fbq;
    __atelieRastreamento?: boolean;
  }
}

/**
 * Cria as filas do gtag e do fbq (os mesmos stubs dos snippets oficiais) e
 * registra os IDs. Idempotente: pode ser chamada antes de cada evento.
 */
function iniciar() {
  if (typeof window === "undefined" || window.__atelieRastreamento) return;
  window.__atelieRastreamento = true;

  if (usaGtag) {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag() {
        // gtag.js exige o objeto `arguments`, não um array.
        window.dataLayer!.push(arguments);
      };
    }
    window.gtag("js", new Date());
    // page_view é enviado à mão a cada troca de rota (ver paginaVista).
    if (GA4_ID) window.gtag("config", GA4_ID, { send_page_view: false });
    if (GADS_ID) window.gtag("config", GADS_ID, { send_page_view: false });
  }

  if (usaMeta) {
    if (!window.fbq) {
      const fbq = ((...args: unknown[]) => {
        if (fbq.callMethod) fbq.callMethod(...args);
        else fbq.queue!.push(args);
      }) as Fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      window.fbq = fbq;
      if (!window._fbq) window._fbq = fbq;
    }
    window.fbq("init", META_PIXEL_ID);
  }
}

function gtag(...args: unknown[]) {
  if (!usaGtag) return;
  iniciar();
  window.gtag?.(...args);
}

function fbq(...args: unknown[]) {
  if (!usaMeta) return;
  iniciar();
  window.fbq?.(...args);
}

// ─── Itens ──────────────────────────────────────────────────────────────────

/** Linha de pedido no formato que os eventos precisam. Preço em centavos. */
export type ItemRastreado = {
  slug: string;
  nome: string;
  categoria?: string;
  acabamento?: string;
  /** Preço unitário em centavos, como no catálogo. */
  preco: number;
  quantidade: number;
};

export function itemDoProduto(
  produto: Produto,
  quantidade = 1,
  acabamento?: string,
): ItemRastreado {
  return {
    slug: produto.slug,
    nome: produto.nome,
    categoria: produto.categoria,
    acabamento,
    preco: produto.preco,
    quantidade,
  };
}

const reais = (centavos: number) => Math.round(centavos) / 100;
const totalItens = (itens: ItemRastreado[]) =>
  itens.reduce((s, i) => s + i.preco * i.quantidade, 0);

function itensGa4(itens: ItemRastreado[]) {
  return itens.map((i) => ({
    item_id: i.slug,
    item_name: i.nome,
    item_category: i.categoria,
    item_variant: i.acabamento,
    price: reais(i.preco),
    quantity: i.quantidade,
  }));
}

function dadosMeta(itens: ItemRastreado[], valorCentavos: number) {
  return {
    content_type: "product",
    content_ids: itens.map((i) => i.slug),
    content_name: itens.length === 1 ? itens[0].nome : undefined,
    contents: itens.map((i) => ({
      id: i.slug,
      quantity: i.quantidade,
      item_price: reais(i.preco),
    })),
    num_items: itens.reduce((s, i) => s + i.quantidade, 0),
    value: reais(valorCentavos),
    currency: "BRL",
  };
}

// ─── Eventos ────────────────────────────────────────────────────────────────

/** O painel é uso interno: não entra nas métricas nem nos públicos. */
const ehPainel = () => window.location.pathname.startsWith("/painel");

export function paginaVista() {
  if (ehPainel()) return;
  gtag("event", "page_view", {
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
  });
  fbq("track", "PageView");
}

export function verItem(item: ItemRastreado) {
  gtag("event", "view_item", {
    currency: "BRL",
    value: reais(item.preco),
    items: itensGa4([item]),
  });
  fbq("track", "ViewContent", dadosMeta([item], item.preco));
}

export function adicionarAoCarrinho(item: ItemRastreado) {
  const valor = item.preco * item.quantidade;
  gtag("event", "add_to_cart", {
    currency: "BRL",
    value: reais(valor),
    items: itensGa4([item]),
  });
  fbq("track", "AddToCart", dadosMeta([item], valor));
}

/** `valorCentavos` inclui o frete, quando já se sabe. */
export function iniciarCheckout(itens: ItemRastreado[], valorCentavos: number) {
  gtag("event", "begin_checkout", {
    currency: "BRL",
    value: reais(valorCentavos),
    items: itensGa4(itens),
  });
  fbq("track", "InitiateCheckout", dadosMeta(itens, valorCentavos));
}

/** Clique num link do WhatsApp: encomenda, orçamento, dúvida. */
export function contato(local: string) {
  if (ehPainel()) return;
  gtag("event", "generate_lead", {
    method: "WhatsApp",
    lead_source: local,
  });
  fbq("track", "Contact", { content_name: local });
}

// ─── Compra ─────────────────────────────────────────────────────────────────
//
// O pagamento acontece na página hospedada da Asaas (Pix ou cartão). Quando
// é aprovado, ela devolve o cliente para /pedido/confirmado?ref=AAS-...
// Essa página não sabe o valor nem os itens — por isso, ao abrir o checkout,
// guardamos um retrato do pedido aqui, indexado pela referência. Na volta,
// lemos o retrato, disparamos a compra UMA vez e marcamos como enviada.
//
// Sem retrato (link compartilhado, outro aparelho, ?ref inventado) não há
// evento: melhor perder uma conversão rara do que inflar as vendas.

const CHAVE_PEDIDOS = "atelie-pedidos-abertos-v1";
const CHAVE_ENVIADAS = "atelie-compras-rastreadas-v1";
const VALIDADE_PEDIDO_MS = 3 * 24 * 60 * 60 * 1000;

type PedidoAberto = {
  itens: ItemRastreado[];
  /** Total cobrado (itens + frete), em centavos, como o servidor calculou. */
  valor: number;
  frete: number;
  criadoEm: number;
};

function lerJson<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravarJson(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem localStorage (aba anônima, cota cheia): a compra não será medida.
  }
}

export function guardarPedidoAberto(
  referencia: string,
  pedido: Omit<PedidoAberto, "criadoEm">,
) {
  const agora = Date.now();
  const abertos = lerJson<Record<string, PedidoAberto>>(CHAVE_PEDIDOS, {});
  // Aproveita para descartar checkouts abandonados há dias.
  for (const [ref, p] of Object.entries(abertos)) {
    if (!p || agora - p.criadoEm > VALIDADE_PEDIDO_MS) delete abertos[ref];
  }
  abertos[referencia] = { ...pedido, criadoEm: agora };
  gravarJson(CHAVE_PEDIDOS, abertos);
}

/**
 * Dispara purchase/Purchase e a conversão do Google Ads para o pedido.
 * Recarregar a página ou voltar a ela não repete o evento.
 */
export function registrarCompra(referencia: string) {
  const enviadas = lerJson<string[]>(CHAVE_ENVIADAS, []);
  if (enviadas.includes(referencia)) return;

  const abertos = lerJson<Record<string, PedidoAberto>>(CHAVE_PEDIDOS, {});
  const pedido = abertos[referencia];
  if (!pedido || !Array.isArray(pedido.itens)) return;

  // Marca ANTES de enviar: se algo falhar no meio, preferimos não repetir.
  gravarJson(CHAVE_ENVIADAS, [...enviadas, referencia].slice(-50));
  delete abertos[referencia];
  gravarJson(CHAVE_PEDIDOS, abertos);

  const valor = pedido.valor || totalItens(pedido.itens) + pedido.frete;

  gtag("event", "purchase", {
    transaction_id: referencia,
    currency: "BRL",
    value: reais(valor),
    shipping: reais(pedido.frete),
    items: itensGa4(pedido.itens),
  });

  if (GADS_ID && GADS_LABEL_COMPRA) {
    gtag("event", "conversion", {
      send_to: `${GADS_ID}/${GADS_LABEL_COMPRA}`,
      transaction_id: referencia,
      currency: "BRL",
      value: reais(valor),
    });
  }

  // eventID = referência: se um dia a API de Conversões (servidor) mandar a
  // mesma compra, o Meta junta as duas em vez de contar em dobro.
  fbq("track", "Purchase", dadosMeta(pedido.itens, valor), {
    eventID: referencia,
  });
}

// ─── Origem do visitante ────────────────────────────────────────────────────
//
// Guarda de onde a pessoa veio (UTMs e IDs de clique do Google/Meta) para
// mandar junto com o pedido. Vale o último anúncio clicado nos últimos 90
// dias: uma entrada nova com parâmetros substitui a anterior.

const CHAVE_ORIGEM = "atelie-origem-v1";
const VALIDADE_ORIGEM_MS = 90 * 24 * 60 * 60 * 1000;

export const PARAMETROS_ORIGEM = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
] as const;

export type Origem = Partial<
  Record<(typeof PARAMETROS_ORIGEM)[number] | "pagina_entrada", string>
> & { capturada_em?: string };

export function capturarOrigem() {
  try {
    const params = new URLSearchParams(window.location.search);
    const origem: Origem = {};
    for (const p of PARAMETROS_ORIGEM) {
      const v = params.get(p)?.trim();
      if (v) origem[p] = v.slice(0, 200);
    }
    if (Object.keys(origem).length === 0) return;

    origem.pagina_entrada = window.location.pathname.slice(0, 200);
    origem.capturada_em = new Date().toISOString();
    localStorage.setItem(CHAVE_ORIGEM, JSON.stringify(origem));
  } catch {
    // localStorage bloqueado: segue sem origem.
  }
}

export function lerOrigem(): Origem | null {
  try {
    const bruto = localStorage.getItem(CHAVE_ORIGEM);
    if (!bruto) return null;
    const origem = JSON.parse(bruto) as Origem;
    const quando = Date.parse(origem.capturada_em ?? "");
    if (!Number.isFinite(quando) || Date.now() - quando > VALIDADE_ORIGEM_MS) {
      localStorage.removeItem(CHAVE_ORIGEM);
      return null;
    }
    return origem;
  } catch {
    return null;
  }
}
