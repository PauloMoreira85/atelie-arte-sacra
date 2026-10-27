"use server";

import { revalidatePath } from "next/cache";
import { exigirLogin, registrar } from "@/lib/painel-auth";
import { db } from "@/lib/supabase";
import {
  baseConfigurado,
  chaveDoXml,
  consultarNota,
  consultarPedidoVenda,
  criarPedidoVenda,
  emitirNfe,
  obterOuCriarCliente,
  obterOuCriarProduto,
} from "@/lib/base";
import { LOJA } from "@/data/loja";

/**
 * Emite a NF-e de um pedido pago, sob comando do painel.
 *
 * Por que manual e não automático: a PCS Moreira é ME e emite nota em toda
 * venda, mas nota errada não se apaga — cancela (prazo curto) ou carta de
 * correção. Enquanto a emissão não tiver rodado certo algumas vezes, quem
 * aperta o botão é uma pessoa que pode conferir antes. Virar automático
 * depois é mover esta chamada para o webhook.
 */

export type EstadoEmissao = { erro?: string; ok?: string } | undefined;

type ItemPedido = {
  produto_slug: string;
  produto_nome: string;
  quantidade: number;
  preco_centavos: number;
  ncm: string | null;
};

type Pedido = {
  referencia: string;
  status: string;
  nfe_status: string;
  base_pedido_id: string | null;
  frete_centavos: number;
  total_centavos: number;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  cliente_cpf_cnpj: string;
  entrega_cep: string | null;
  entrega_logradouro: string | null;
  entrega_numero: string | null;
  entrega_complemento: string | null;
  entrega_bairro: string | null;
  entrega_cidade: string | null;
  entrega_uf: string | null;
  pago_em: string | null;
  pedido_itens: ItemPedido[];
};

const reais = (centavos: number) => Number((centavos / 100).toFixed(2));

/** Grava o motivo da falha no pedido para aparecer no painel. */
async function marcarErro(referencia: string, mensagem: string) {
  await db()
    .from("pedidos")
    .update({ nfe_status: "erro", nfe_erro: mensagem.slice(0, 500) })
    .eq("referencia", referencia);
}

export async function emitirNota(
  referencia: string,
  _estado: EstadoEmissao,
  // Vem do useActionState, que sempre manda o FormData do <form>. Não usamos
  // nada dele — a referência chega pelo bind — mas precisa estar na
  // assinatura para o tipo bater com o do componente.
  _dados: FormData,
): Promise<EstadoEmissao> {
  const usuario = await exigirLogin();

  if (!baseConfigurado()) {
    return { erro: "BASE_API_KEY não configurada. Veja COMO-EDITAR.md > Nota fiscal." };
  }

  const { data, error } = await db()
    .from("pedidos")
    .select("*, pedido_itens(*)")
    .eq("referencia", referencia)
    .single<Pedido>();

  if (error || !data) return { erro: "Pedido não encontrado." };

  // ── Conferências antes de tocar na API ──────────────────────────────────
  // Barrar aqui é barato; nota emitida errada custa cancelamento.
  if (data.status !== "pago") {
    return { erro: "Só emite nota de pedido pago." };
  }
  if (data.nfe_status === "emitida") {
    return { erro: "Este pedido já tem nota." };
  }
  if (!data.pedido_itens?.length) {
    return { erro: "O pedido não tem itens." };
  }

  const falta = [
    ["CEP", data.entrega_cep],
    ["rua", data.entrega_logradouro],
    ["número", data.entrega_numero],
    ["bairro", data.entrega_bairro],
    ["cidade", data.entrega_cidade],
    ["UF", data.entrega_uf],
  ].filter(([, v]) => !v);

  if (falta.length > 0) {
    // Acontece quando o webhook não conseguiu buscar o endereço na Asaas.
    // A nota não sai sem destinatário completo.
    return {
      erro: `Falta o endereço de entrega (${falta.map(([n]) => n).join(", ")}). Complete no Supabase ou confira o cliente na Asaas.`,
    };
  }

  try {
    // ── Cliente ───────────────────────────────────────────────────────────
    const clienteId = await obterOuCriarCliente({
      nome: data.cliente_nome,
      cpfCnpj: data.cliente_cpf_cnpj,
      email: data.cliente_email,
      telefone: data.cliente_telefone,
      cep: data.entrega_cep!,
      logradouro: data.entrega_logradouro!,
      numero: data.entrega_numero!,
      complemento: data.entrega_complemento,
      bairro: data.entrega_bairro!,
      cidade: data.entrega_cidade!,
      uf: data.entrega_uf!,
    });

    // ── Produtos ──────────────────────────────────────────────────────────
    // Em série, de propósito: duas peças novas em paralelo poderiam criar o
    // mesmo cadastro duas vezes.
    const itens: { produtoId: string; quantidade: number; precoUnitReais: number }[] = [];
    for (const item of data.pedido_itens) {
      const produtoId = await obterOuCriarProduto({
        slug: item.produto_slug,
        nome: item.produto_nome,
        precoReais: reais(item.preco_centavos),
        // NCM gravado na venda, não o atual: se a classificação mudar, a nota
        // antiga mantém a que valia na época.
        ncm: item.ncm ?? LOJA.fiscal.ncmPadrao,
      });
      itens.push({
        produtoId,
        quantidade: item.quantidade,
        precoUnitReais: reais(item.preco_centavos),
      });
    }

    // ── Pedido de venda ───────────────────────────────────────────────────
    // Reaproveita o pedido já criado numa tentativa anterior que falhou só na
    // emissão — senão ficariam dois pedidos no Base para a mesma venda.
    const pedidoBaseId =
      data.base_pedido_id ??
      (await criarPedidoVenda({
        referencia: data.referencia,
        clienteId,
        itens,
        freteReais: reais(data.frete_centavos),
        totalReais: reais(data.total_centavos),
        pagoEm: data.pago_em ?? new Date().toISOString(),
      }));

    if (!data.base_pedido_id) {
      await db()
        .from("pedidos")
        .update({ base_pedido_id: pedidoBaseId })
        .eq("referencia", referencia);
    }

    // ── Nota ──────────────────────────────────────────────────────────────
    const nfe = await emitirNfe(pedidoBaseId);

    // A SEFAZ leva alguns segundos para autorizar. Consultamos uma vez; se
    // ainda estiver processando, o botão "Atualizar" do painel busca depois.
    let invoiceId = nfe.invoiceId;
    let numero = nfe.invoiceNumber;
    let situacao = nfe.invoiceStatus;

    if (!numero) {
      await new Promise((r) => setTimeout(r, 4000));
      const atual = await consultarPedidoVenda(pedidoBaseId);
      invoiceId = atual.invoiceId ?? invoiceId;
      numero = atual.invoiceNumber ?? numero;
      situacao = atual.invoiceStatus ?? situacao;
    }

    let chave: string | null = null;
    let danfe: string | null = null;

    if (invoiceId) {
      const nota = await consultarNota(String(invoiceId)).catch(() => null);
      danfe = nota?.pdfUrl ?? null;
      if (nota?.xmlUrl) chave = await chaveDoXml(nota.xmlUrl).catch(() => null);
      if (nota?.rejectionReason) {
        await marcarErro(referencia, nota.rejectionReason);
        await registrar(usuario.id, usuario.nome, "nfe_rejeitada", referencia, {
          motivo: nota.rejectionReason,
        });
        revalidatePath("/painel/pedidos");
        return { erro: `A SEFAZ rejeitou: ${nota.rejectionReason}` };
      }
    }

    const autorizada = Boolean(numero);

    await db()
      .from("pedidos")
      .update({
        nfe_status: autorizada ? "emitida" : "pendente",
        nfe_numero: numero,
        nfe_chave: chave,
        nfe_danfe_url: danfe,
        nfe_erro: null,
      })
      .eq("referencia", referencia);

    await registrar(usuario.id, usuario.nome, "nfe_emitida", referencia, {
      numero,
      situacao,
    });

    revalidatePath("/painel/pedidos");

    return autorizada
      ? { ok: `Nota ${numero} emitida.` }
      : { ok: "Nota enviada. A SEFAZ ainda está processando — use Atualizar em instantes." };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.error("[nfe]", referencia, mensagem);
    await marcarErro(referencia, mensagem);
    await registrar(usuario.id, usuario.nome, "nfe_falhou", referencia, { erro: mensagem });
    revalidatePath("/painel/pedidos");
    return { erro: mensagem };
  }
}

/**
 * Relê a situação da nota no Base. Serve para quando a SEFAZ ainda estava
 * processando no momento da emissão.
 */
export async function atualizarNota(
  referencia: string,
  _estado: EstadoEmissao,
  _dados: FormData,
): Promise<EstadoEmissao> {
  const usuario = await exigirLogin();

  const { data } = await db()
    .from("pedidos")
    .select("base_pedido_id")
    .eq("referencia", referencia)
    .single<{ base_pedido_id: string | null }>();

  if (!data?.base_pedido_id) return { erro: "Este pedido ainda não foi enviado ao Base." };

  try {
    const atual = await consultarPedidoVenda(data.base_pedido_id);
    if (!atual.invoiceNumber) {
      return { ok: `Ainda processando (${atual.invoiceStatus ?? "sem situação"}).` };
    }

    let chave: string | null = null;
    let danfe: string | null = null;
    if (atual.invoiceId) {
      const nota = await consultarNota(String(atual.invoiceId)).catch(() => null);
      danfe = nota?.pdfUrl ?? null;
      if (nota?.xmlUrl) chave = await chaveDoXml(nota.xmlUrl).catch(() => null);
    }

    await db()
      .from("pedidos")
      .update({
        nfe_status: "emitida",
        nfe_numero: atual.invoiceNumber,
        nfe_chave: chave,
        nfe_danfe_url: danfe,
        nfe_erro: null,
      })
      .eq("referencia", referencia);

    await registrar(usuario.id, usuario.nome, "nfe_atualizada", referencia, {
      numero: atual.invoiceNumber,
    });
    revalidatePath("/painel/pedidos");
    return { ok: `Nota ${atual.invoiceNumber} autorizada.` };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    return { erro: mensagem };
  }
}
