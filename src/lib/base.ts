import "server-only";
import { LOJA } from "@/data/loja";

/**
 * Cliente do Base by Asaas — o ERP que emite a NF-e. Roda SOMENTE no servidor.
 *
 * Quem emite é a PCS Moreira (CNPJ 22.771.295/0001-32), a mesma empresa da Só
 * Filamentos. "Ateliê Arte Sacra" é a marca do site, não uma empresa separada.
 * As duas lojas dividem o mesmo cadastro aqui — por isso o código de cada peça
 * leva o prefixo AAS-, para não colidir com os MP-FILAMENTO que já existem.
 *
 * ⚠️ O Base tem painel e chave PRÓPRIOS, separados do Asaas. A chave do Asaas
 * aqui devolve 403, não 401 — o formato é parecido o bastante para a API
 * aceitar a chave e negar o acesso, o que engana na hora de diagnosticar.
 *
 * CFOP, CSOSN e natureza de operação NÃO ficam no código: vêm dos "grupos de
 * tributação" configurados no painel do Base.
 *
 * Docs: https://docs.baseerp.com.br
 */

const SANDBOX_URL = "https://api-sandbox.baseerp.com.br";
const PRODUCAO_URL = "https://api.baseerp.com.br";

export function baseConfigurado() {
  return Boolean(process.env.BASE_API_KEY?.trim());
}

function config() {
  const chave = process.env.BASE_API_KEY?.trim();
  if (!chave) {
    throw new Error("BASE_API_KEY não configurada. Veja COMO-EDITAR.md > Nota fiscal.");
  }
  // Mesma armadilha da chave do Asaas: começa com "$" e, em arquivos .env, o
  // cifrão vira expansão de variável. Aspas duplas não bastam — é preciso
  // escapar: BASE_API_KEY="\$aeact_...". Chave truncada aqui só falharia na
  // hora de emitir a nota, com o dinheiro já recebido.
  if (chave.startsWith("aeact_") || chave.length < 20) {
    throw new Error(
      'BASE_API_KEY parece truncada. No .env, escape o cifrão: BASE_API_KEY="\\$aeact_..."',
    );
  }
  const ehSandbox = process.env.BASE_AMBIENTE !== "producao";
  return { chave, baseUrl: ehSandbox ? SANDBOX_URL : PRODUCAO_URL };
}

type Pagina<T> = { content: T[] };

async function req<T>(
  caminho: string,
  init: RequestInit & { json?: unknown; idempotencia?: string } = {},
): Promise<T> {
  const { chave, baseUrl } = config();
  const { json, idempotencia, ...resto } = init;

  const resposta = await fetch(`${baseUrl}${caminho}`, {
    ...resto,
    headers: {
      access_token: chave,
      "User-Agent": "AtelieArteSacra/1.0",
      ...(json ? { "Content-Type": "application/json" } : {}),
      // Evita nota duplicada se a mesma chamada for repetida — por retentativa
      // nossa ou por clique duplo no painel.
      ...(idempotencia ? { "Idempotency-Key": idempotencia } : {}),
      ...resto.headers,
    },
    ...(json ? { body: JSON.stringify(json) } : {}),
    cache: "no-store",
  });

  const texto = await resposta.text();

  if (!resposta.ok) {
    let detalhe = texto.slice(0, 300);
    try {
      const erro = JSON.parse(texto);
      if (Array.isArray(erro?.errors)) {
        detalhe = erro.errors
          .map((e: { description?: string; message?: string }) => e.description ?? e.message)
          .filter(Boolean)
          .join("; ");
      } else if (erro?.message) {
        detalhe = erro.message;
      }
    } catch {
      // resposta não-JSON: mantém o texto cru
    }
    throw new Error(`Base ${resposta.status}: ${detalhe}`);
  }

  return texto ? (JSON.parse(texto) as T) : ({} as T);
}

// ── Produtos ───────────────────────────────────────────────────────────────

/**
 * Acha a peça no catálogo do Base pelo código, ou cadastra se não existir.
 *
 * O código é o slug com prefixo (AAS-anjo-luminaria): o cadastro é dividido
 * com a Só Filamentos, e sem prefixo um dia um slug nosso bateria com um
 * produto deles.
 */
export async function obterOuCriarProduto(p: {
  slug: string;
  nome: string;
  precoReais: number;
  ncm: string;
}) {
  const codigo = `${LOJA.fiscal.prefixoProduto}${p.slug}`;

  const busca = await req<Pagina<{ id: number }>>(
    `/api/v1/products?code=${encodeURIComponent(codigo)}&size=1`,
  );
  if (busca.content[0]) return String(busca.content[0].id);

  const novo = await req<{ id: number }>("/api/v1/products", {
    method: "POST",
    json: {
      code: codigo,
      name: p.nome.slice(0, 120),
      ncm: p.ncm,
      unit: "UN",
      salePrice: p.precoReais,
      externalReference: codigo,
    },
  });
  return String(novo.id);
}

// ── Clientes ───────────────────────────────────────────────────────────────

export type EnderecoCliente = {
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  uf: string;
};

/**
 * Acha o cliente pelo CPF/CNPJ, ou cadastra. Se já existir, atualiza o
 * endereço: o cliente pode ter mudado de casa entre uma compra e outra, e a
 * nota tem que sair para onde a peça realmente vai.
 */
export async function obterOuCriarCliente(c: EnderecoCliente) {
  const endereco = {
    postalCode: c.cep,
    address: c.logradouro,
    addressNumber: c.numero,
    complement: c.complemento ?? undefined,
    province: c.bairro,
    cityName: c.cidade,
    stateAbbrev: c.uf,
    country: "Brasil",
  };

  const corpo = {
    name: c.nome.slice(0, 60),
    cpfCnpj: c.cpfCnpj,
    email: c.email,
    mobilePhone: c.telefone,
    externalReference: c.cpfCnpj,
    billingAddress: endereco,
    deliveryAddress: {
      ...endereco,
      name: c.nome.slice(0, 60),
      cpfCnpj: c.cpfCnpj,
      email: c.email,
      phone: c.telefone,
    },
    // Vendemos para consumidor final pessoa física. Cliente PJ com inscrição
    // estadual precisaria de outro enquadramento — se um dia acontecer, é aqui
    // que muda.
    taxInformation: { typeOfTaxPayer: "NAO_CONTRIBUINTE", finalConsumer: true },
  };

  const busca = await req<Pagina<{ id: number }>>(
    `/api/v1/customers?externalReference=${encodeURIComponent(c.cpfCnpj)}&size=1`,
  ).catch(() => ({ content: [] as { id: number }[] }));

  if (busca.content[0]) {
    const id = String(busca.content[0].id);
    // Se a atualização falhar, seguimos com o cadastro antigo: melhor emitir
    // com endereço desatualizado do que travar a nota.
    await req(`/api/v1/customers/${id}`, { method: "PUT", json: corpo }).catch(() => undefined);
    return id;
  }

  const novo = await req<{ id: number }>("/api/v1/customers", { method: "POST", json: corpo });
  return String(novo.id);
}

// ── Pedido de venda e nota ─────────────────────────────────────────────────

/** Conta Asaas cadastrada no Base, para onde o pagamento é lançado. */
let contaAsaasCache: number | null = null;
async function contaAsaas() {
  if (contaAsaasCache) return contaAsaasCache;
  const r = await req<Pagina<{ id: number }> | { id: number }[]>("/api/v1/banks?onlyAsaas=true");
  const lista = Array.isArray(r) ? r : r.content;
  if (!lista[0]) throw new Error("Base: conta Asaas não encontrada em /banks.");
  contaAsaasCache = lista[0].id;
  return contaAsaasCache;
}

export async function criarPedidoVenda(p: {
  referencia: string;
  clienteId: string;
  itens: { produtoId: string; quantidade: number; precoUnitReais: number }[];
  freteReais: number;
  totalReais: number;
  pagoEm: string;
}) {
  const hoje = new Date().toISOString().slice(0, 10);

  const r = await req<{ id: number }>("/api/v1/salesOrders", {
    method: "POST",
    idempotencia: p.referencia,
    json: {
      customerId: Number(p.clienteId),
      issueDate: hoje,
      externalReference: p.referencia,
      // Diz de qual loja veio a venda: o Base é compartilhado com a Só
      // Filamentos, e sem isso os pedidos se misturam na tela.
      observations: `${p.referencia} — ${LOJA.nome}`,
      // EMITENTE: o frete é por nossa conta, foi cobrado do cliente e entra
      // no total da nota.
      typeOfShipping: "EMITENTE",
      costOfShipping: p.freteReais,
      discountValue: 0,
      orderItems: p.itens.map((i) => ({
        productId: Number(i.produtoId),
        quantity: i.quantidade,
        unitPrice: i.precoUnitReais,
      })),
      orderPayments: [
        {
          dueDate: p.pagoEm.slice(0, 10),
          receiptDate: p.pagoEm.slice(0, 10),
          value: p.totalReais,
          bankId: await contaAsaas(),
        },
      ],
    },
  });

  return String(r.id);
}

export type RespostaNfe = {
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
};

/**
 * Enfileira a NF-e modelo 55.
 *
 * Modelo 55 e não 65 (NFC-e): a NFC-e não cobre venda interestadual, e as
 * peças vão para todo o Brasil.
 *
 * A resposta é só o aceite do pedido — a autorização pela SEFAZ leva alguns
 * segundos. Consulte depois com consultarPedidoVenda().
 */
export function emitirNfe(pedidoVendaId: string) {
  return req<RespostaNfe>(`/api/v1/salesOrders/${pedidoVendaId}/invoice`, {
    method: "POST",
    json: { type: "55" },
    idempotencia: `nfe-${pedidoVendaId}`,
  });
}

export function consultarPedidoVenda(pedidoVendaId: string) {
  return req<RespostaNfe & { id: number }>(`/api/v1/salesOrders/${pedidoVendaId}`);
}

export function consultarNota(invoiceId: string) {
  return req<{
    id: number;
    number: string | null;
    status: string | null;
    xmlUrl: string | null;
    pdfUrl: string | null;
    rejectionReason: string | null;
  }>(`/api/v1/invoices/${invoiceId}`);
}

/** A chave de acesso (44 dígitos) só existe dentro do XML. */
export async function chaveDoXml(xmlUrl: string) {
  const r = await fetch(xmlUrl, { cache: "no-store" });
  if (!r.ok) throw new Error(`Não consegui baixar o XML da NF-e (${r.status}).`);
  const xml = await r.text();
  const m = xml.match(/<chNFe>(\d{44})<\/chNFe>/) ?? xml.match(/Id="NFe(\d{44})"/);
  return m?.[1] ?? null;
}
