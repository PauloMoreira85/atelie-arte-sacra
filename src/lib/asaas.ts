import "server-only";

/**
 * Cliente da API Asaas. Roda SOMENTE no servidor — a chave nunca vai ao browser.
 *
 * Usamos o Checkout hospedado (POST /v3/checkouts): a Asaas devolve um link,
 * redirecionamos o cliente para lá e ele paga com Pix ou cartão na
 * página deles. Assim nenhum dado de cartão passa pelo nosso servidor, o que
 * nos tira totalmente do escopo de PCI.
 *
 * Docs: https://docs.asaas.com/docs/asaas-checkout
 */

const SANDBOX_URL = "https://api-sandbox.asaas.com/v3";
const PRODUCAO_URL = "https://api.asaas.com/v3";

export function asaasConfigurado() {
  return Boolean(process.env.ASAAS_API_KEY?.trim());
}

function config() {
  const apiKey = process.env.ASAAS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "ASAAS_API_KEY não configurada. Veja o COMO-EDITAR.md para gerar a chave.",
    );
  }

  // Armadilha conhecida: a chave da Asaas começa com "$aact_...". Em arquivos
  // .env o cifrão é tratado como expansão de variável e a chave chega vazia —
  // a loja só quebraria na hora do pagamento.
  //
  // ⚠️ Aspas duplas NÃO bastam: o dotenv expande "$" mesmo dentro delas. É
  // preciso escapar com barra invertida:
  //     ASAAS_API_KEY="\$aact_prod_..."
  if (apiKey.startsWith("aact_") || apiKey.length < 20) {
    throw new Error(
      'ASAAS_API_KEY parece truncada. No .env, escape o cifrão inicial: ' +
        'ASAAS_API_KEY="\$aact_..." (a barra antes do $ é obrigatória).',
    );
  }
  // Chaves de sandbox da Asaas começam com $aact_hmlg_. Detectamos o ambiente
  // pela própria chave para não ser possível apontar uma chave de homologação
  // para produção (ou o contrário) por engano.
  const ehSandbox =
    process.env.ASAAS_AMBIENTE === "sandbox" || apiKey.includes("_hmlg_");
  return { apiKey, baseUrl: ehSandbox ? SANDBOX_URL : PRODUCAO_URL, ehSandbox };
}

export type ItemCheckout = {
  name: string;
  description?: string;
  quantity: number;
  /** Valor UNITÁRIO em reais (a Asaas trabalha em reais, não centavos). */
  value: number;
};

export type DadosCheckout = {
  itens: ItemCheckout[];
  /** true quando o pedido tem frete — a Asaas passa a exigir endereço. */
  comEntrega?: boolean;
  /** Referência do pedido no nosso lado, para conciliar depois. */
  referenciaExterna: string;
  cliente: {
    name: string;
    email: string;
    phone: string;
    cpfCnpj: string;
  };
  urls: { sucesso: string; cancelado: string; expirado: string };
  /** Máximo de parcelas no cartão. 1 = à vista. */
  parcelasMax?: number;
};

export type RespostaCheckout = { id: string; link: string; status?: string };

export async function criarCheckout(
  dados: DadosCheckout,
): Promise<RespostaCheckout> {
  const { apiKey, baseUrl } = config();

  // Com entrega, a Asaas valida o endereço dentro de customerData. Como não
  // coletamos rua/número no carrinho, deixamos ela pedir tudo na tela dela.
  const cliente = dados.comEntrega ? undefined : dados.cliente;

  const corpo: Record<string, unknown> = {
    billingTypes: ["PIX", "CREDIT_CARD"],
    chargeTypes: dados.parcelasMax && dados.parcelasMax > 1
      ? ["DETACHED", "INSTALLMENT"]
      : ["DETACHED"],
    minutesToExpire: 60,
    externalReference: dados.referenciaExterna,
    items: dados.itens,
    ...(cliente ? { customerData: cliente } : {}),
    callback: {
      successUrl: dados.urls.sucesso,
      cancelUrl: dados.urls.cancelado,
      expiredUrl: dados.urls.expirado,
    },
  };

  if (dados.parcelasMax && dados.parcelasMax > 1) {
    corpo.installment = { maxInstallmentCount: dados.parcelasMax };
  }

  const resposta = await fetch(`${baseUrl}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      "User-Agent": "AtelieArteSacra/1.0",
    },
    body: JSON.stringify(corpo),
    cache: "no-store",
  });

  const texto = await resposta.text();

  if (!resposta.ok) {
    // A Asaas devolve { errors: [{ code, description }] }. Logamos o detalhe no
    // servidor e deixamos a rota decidir o que mostrar ao cliente.
    let detalhe = texto;
    try {
      const json = JSON.parse(texto);
      if (Array.isArray(json?.errors)) {
        detalhe = json.errors
          .map((e: { description?: string }) => e.description)
          .filter(Boolean)
          .join("; ");
      }
    } catch {
      // resposta não-JSON: mantém o texto cru
    }
    throw new Error(`Asaas ${resposta.status}: ${detalhe}`);
  }

  const json = JSON.parse(texto) as RespostaCheckout;
  if (!json.link) {
    throw new Error("Asaas respondeu sem o link de checkout.");
  }
  return json;
}

/**
 * Endereço de entrega do cliente, do jeito que a Asaas devolve.
 *
 * Nasceu da NF-e: a PCS Moreira é ME e emite nota em toda venda, e nota exige
 * o endereço completo do destinatário. O carrinho não pede rua e número — quem
 * coleta é a tela da Asaas (veja o comentário em criarCheckout). Então é de lá
 * que buscamos, depois que o pagamento confirma.
 */
export type ClienteAsaas = {
  name: string;
  cpfCnpj: string;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  postalCode: string | null;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  /** Bairro. O nome vem assim da API deles. */
  province: string | null;
  cityName: string | null;
  state: string | null;
};

/**
 * Busca um cliente pelo id (cus_...) que vem no evento CHECKOUT_PAID.
 *
 * Docs: https://docs.asaas.com/reference/recuperar-um-unico-cliente
 */
export async function buscarCliente(id: string): Promise<ClienteAsaas> {
  const { apiKey, baseUrl } = config();

  const resposta = await fetch(`${baseUrl}/customers/${encodeURIComponent(id)}`, {
    headers: {
      access_token: apiKey,
      "User-Agent": "AtelieArteSacra/1.0",
    },
    cache: "no-store",
  });

  const texto = await resposta.text();
  if (!resposta.ok) {
    throw new Error(`Asaas ${resposta.status} ao buscar cliente: ${texto.slice(0, 200)}`);
  }

  return JSON.parse(texto) as ClienteAsaas;
}
