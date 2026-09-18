import "server-only";

/**
 * Cliente da API Asaas. Roda SOMENTE no servidor — a chave nunca vai ao browser.
 *
 * Usamos o Checkout hospedado (POST /v3/checkouts): a Asaas devolve um link,
 * redirecionamos o cliente para lá e ele paga com Pix, cartão ou boleto na
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
  // .env o cifrão é tratado como expansão de variável, então uma chave colada
  // sem aspas duplas chega aqui vazia ou truncada — e a loja quebraria só na
  // hora do pagamento. Avisamos cedo e com a solução explícita.
  if (apiKey.startsWith("aact_") || apiKey.length < 20) {
    throw new Error(
      'ASAAS_API_KEY parece truncada. No .env, a chave PRECISA estar entre ' +
        'aspas duplas por causa do "$" inicial: ASAAS_API_KEY="$aact_..."',
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

  const corpo: Record<string, unknown> = {
    billingTypes: ["PIX", "CREDIT_CARD"],
    chargeTypes: dados.parcelasMax && dados.parcelasMax > 1
      ? ["DETACHED", "INSTALLMENT"]
      : ["DETACHED"],
    minutesToExpire: 60,
    externalReference: dados.referenciaExterna,
    items: dados.itens,
    customerData: dados.cliente,
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
