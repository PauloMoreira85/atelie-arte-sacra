"use server";

import { revalidatePath } from "next/cache";
import { exigirLogin, registrar } from "@/lib/painel-auth";
import { limparCacheCatalogo } from "@/lib/catalogo";
import { db } from "@/lib/supabase";

/**
 * Salva um produto editado no painel.
 *
 * Toda validação acontece aqui no servidor: o formulário do browser pode ser
 * burlado, então nada do que vem dele é aceito sem conferência.
 */

const numero = (v: FormDataEntryValue | null, padrao = 0) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : padrao;
};

const linhas = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

export type EstadoSalvar = { erro?: string; ok?: boolean } | undefined;

export async function salvarProduto(
  id: string,
  _estado: EstadoSalvar,
  dados: FormData,
): Promise<EstadoSalvar> {
  const usuario = await exigirLogin();

  const nome = String(dados.get("nome") ?? "").trim();
  if (nome.length < 2) return { erro: "Informe o nome da peça." };

  // Preço chega em reais ("189,90") e é guardado em centavos.
  const precoReais = numero(dados.get("preco"));
  const preco = Math.round(precoReais * 100);
  if (!Number.isInteger(preco) || preco <= 0) {
    return { erro: "Preço inválido." };
  }

  const pesoG = Math.round(numero(dados.get("peso_g"), 0));
  if (pesoG <= 0) {
    return {
      erro: "O peso precisa ser maior que zero — é ele que calcula o frete.",
    };
  }

  const acabamentos = String(dados.get("acabamentos") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (acabamentos.length === 0) {
    return { erro: "Informe ao menos um acabamento." };
  }

  const imagens = linhas(dados.get("imagens"));
  if (imagens.length === 0) {
    return { erro: "A peça precisa de ao menos uma imagem." };
  }

  const descricao = String(dados.get("descricao") ?? "")
    .split(/\n\s*\n/)
    .map((s) => s.trim().replace(/\s*\n\s*/g, " "))
    .filter(Boolean);

  const atualizacao = {
    nome,
    preco,
    resumo: String(dados.get("resumo") ?? "").trim(),
    descricao,
    medida_altura: numero(dados.get("medida_altura")),
    medida_largura: numero(dados.get("medida_largura")),
    medida_profundidade: numero(dados.get("medida_profundidade")),
    peso_g: pesoG,
    caixa_altura: numero(dados.get("caixa_altura"), 20),
    caixa_largura: numero(dados.get("caixa_largura"), 15),
    caixa_comprimento: numero(dados.get("caixa_comprimento"), 15),
    acabamentos,
    imagens,
    destaque: dados.get("destaque") === "on",
    ativo: dados.get("ativo") === "on",
    prazo_producao: Math.max(
      0,
      Math.round(numero(dados.get("prazo_producao"), 5)),
    ),
    categoria_id: String(dados.get("categoria_id") ?? "") || null,
  };

  const { data: antes } = await db()
    .from("produtos")
    .select("preco,nome")
    .eq("id", id)
    .maybeSingle();

  const { error } = await db().from("produtos").update(atualizacao).eq("id", id);

  if (error) {
    console.error("[painel] erro ao salvar produto:", error.message);
    return { erro: "Não foi possível salvar. Tente de novo." };
  }

  // Registra a mudança de preço, que é a mais sensível das edições.
  await registrar(
    usuario.id,
    usuario.nome,
    "editou produto",
    nome,
    antes && antes.preco !== preco
      ? { preco_antes: antes.preco, preco_depois: preco }
      : undefined,
  );

  // Faz o site refletir a mudança imediatamente.
  limparCacheCatalogo();
  revalidatePath("/", "layout");

  return { ok: true };
}
