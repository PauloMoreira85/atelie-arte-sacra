import { after, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { buscarCliente } from "@/lib/asaas";
import { db, supabaseConfigurado } from "@/lib/supabase";

/**
 * Webhook da Asaas — é por aqui que descobrimos que o cliente pagou.
 *
 * Por que existe: a tela de "pedido confirmado" NÃO prova pagamento. O cliente
 * pode fechar o navegador antes, ou abrir a URL de sucesso na mão. A própria
 * Asaas recomenda confirmar só pelo webhook.
 *
 * O que fazemos quando chega CHECKOUT_PAID:
 *  1. marca o pedido como pago;
 *  2. busca o endereço de entrega na Asaas e grava aqui.
 *
 * O passo 2 existe porque o carrinho não pede rua e número — quem coleta é a
 * tela da Asaas. E a NF-e não sai sem o endereço do destinatário.
 *
 * Configurar em: Asaas → Integrações → Webhooks
 *   URL:    https://atelieartesacra.com.br/api/webhooks/asaas
 *   Token:  o mesmo valor de ASAAS_WEBHOOK_TOKEN
 *   Evento: CHECKOUT_PAID (e os de cancelamento, se quiser)
 *
 * Docs: https://docs.asaas.com/docs/eventos-para-checkout
 */

export const runtime = "nodejs";

/**
 * Compara o token sem vazar informação pelo tempo de resposta.
 *
 * Um `===` comum sai no primeiro caractere diferente, e medindo esse tempo dá
 * para descobrir o token letra por letra. Aqui o custo é sempre o mesmo.
 */
function tokenConfere(recebido: string | null) {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!esperado || !recebido) return false;

  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  // timingSafeEqual exige buffers do mesmo tamanho, e o próprio tamanho já
  // seria uma pista — por isso a checagem vem antes, de propósito.
  return a.length === b.length && timingSafeEqual(a, b);
}

type EventoAsaas = {
  id?: string;
  event?: string;
  checkout?: {
    id?: string;
    status?: string;
    customer?: string | null;
    externalReference?: string | null;
  };
};

/** Só dígitos, para CEP e telefone. */
const soDigitos = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

/**
 * Busca o endereço na Asaas e grava no pedido.
 *
 * Falhar aqui NÃO desfaz o pagamento: o pedido continua pago e o endereço pode
 * ser completado depois, à mão ou numa nova tentativa. Por isso o erro só vai
 * para o log.
 */
async function gravarEndereco(referencia: string, clienteId: string) {
  const cliente = await buscarCliente(clienteId);

  const { error } = await db()
    .from("pedidos")
    .update({
      entrega_cep: soDigitos(cliente.postalCode) || null,
      entrega_logradouro: cliente.address,
      entrega_numero: cliente.addressNumber,
      entrega_complemento: cliente.complement,
      entrega_bairro: cliente.province,
      entrega_cidade: cliente.cityName,
      entrega_uf: cliente.state,
    })
    .eq("referencia", referencia);

  if (error) {
    console.warn("[webhook] não gravou o endereço:", referencia, error.message);
  }
}

export async function POST(request: Request) {
  if (!tokenConfere(request.headers.get("asaas-access-token"))) {
    return new NextResponse("não autorizado", { status: 401 });
  }

  const evento = (await request.json().catch(() => null)) as EventoAsaas | null;
  if (!evento?.event) {
    // Corpo estranho: respondemos 200 mesmo assim. Devolver erro faz a Asaas
    // reenviar para sempre um evento que nunca vamos entender.
    return NextResponse.json({ ok: true });
  }

  const referencia = evento.checkout?.externalReference ?? null;
  const clienteId = evento.checkout?.customer ?? null;

  // Só nos interessam as referências que nós mesmos geramos (AAS-...). A conta
  // Asaas é compartilhada com as outras lojas do mesmo CNPJ, então chegam aqui
  // eventos que não são do Ateliê.
  if (!referencia?.startsWith("AAS-") || !supabaseConfigurado()) {
    return NextResponse.json({ ok: true });
  }

  // Responde rápido e trabalha depois: a Asaas tem timeout curto e reenvia o
  // evento se demorarmos. Buscar o cliente é uma chamada de rede a mais.
  after(async () => {
    try {
      if (evento.event === "CHECKOUT_PAID") {
        const { error, count } = await db()
          .from("pedidos")
          .update(
            { status: "pago", pago_em: new Date().toISOString() },
            // Queremos saber QUANTAS linhas mudaram. Sem isso, um update que
            // não encontra nada volta como sucesso — e um pedido pago que
            // nunca foi gravado passaria despercebido.
            { count: "exact" },
          )
          .eq("referencia", referencia)
          // Só sai de "aberto". O evento pode chegar duas vezes (a Asaas
          // entrega "pelo menos uma vez"), e sem isso o pago_em seria
          // reescrito a cada reenvio.
          .eq("status", "aberto");

        if (error) {
          console.error("[webhook] não marcou como pago:", referencia, error.message);
          return;
        }

        if (count === 0) {
          // Ou é reenvio de um evento já processado (normal), ou o pedido
          // nunca chegou à nossa tabela (grave: há dinheiro entrando sem
          // registro). Conferir pela referência no extrato da Asaas.
          console.warn(
            "[webhook] CHECKOUT_PAID não encontrou pedido aberto:",
            referencia,
            "— reenvio, ou o checkout não foi gravado?",
          );
          return;
        }

        if (clienteId) {
          await gravarEndereco(referencia, clienteId);
        } else {
          console.warn("[webhook] CHECKOUT_PAID sem id de cliente:", referencia);
        }
      } else if (
        evento.event === "CHECKOUT_CANCELED" ||
        evento.event === "CHECKOUT_EXPIRED"
      ) {
        const status = evento.event === "CHECKOUT_CANCELED" ? "cancelado" : "expirado";
        await db()
          .from("pedidos")
          .update({ status })
          // Nunca rebaixa um pedido já pago: se os eventos chegarem fora de
          // ordem, pago vence.
          .eq("referencia", referencia)
          .eq("status", "aberto");
      }
    } catch (erro) {
      console.error("[webhook]", evento.event, referencia, erro);
    }
  });

  return NextResponse.json({ ok: true });
}
