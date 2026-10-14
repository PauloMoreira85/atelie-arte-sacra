import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { db, supabaseConfigurado } from "@/lib/supabase";
import {
  PRODUTOS as PRODUTOS_ARQUIVO,
  CATEGORIAS as CATEGORIAS_ARQUIVO,
  type Produto,
  type Categoria,
} from "@/data/produtos";

/**
 * Catálogo do site.
 *
 * Lê do banco quando o Supabase está configurado; senão cai no arquivo
 * src/data/produtos.ts. Isso permite rodar o site sem banco (e manter o
 * histórico funcionando) enquanto o painel é validado.
 *
 * O formato devolvido é EXATAMENTE o mesmo do arquivo, então nenhum
 * componente precisou mudar.
 */

const TAG = "catalogo";

type LinhaProduto = {
  slug: string;
  nome: string;
  preco: number;
  resumo: string;
  descricao: string[];
  medida_altura: number;
  medida_largura: number;
  medida_profundidade: number;
  peso_g: number;
  caixa_altura: number;
  caixa_largura: number;
  caixa_comprimento: number;
  acabamentos: string[];
  imagens: string[];
  destaque: boolean;
  prazo_producao: number;
  fundo_card: string | null;
  categorias: { slug: string } | null;
};

function paraProduto(l: LinhaProduto): Produto {
  return {
    slug: l.slug,
    nome: l.nome,
    categoria: (l.categorias?.slug ?? "devocionais") as Categoria,
    preco: l.preco,
    resumo: l.resumo,
    descricao: l.descricao,
    medidas: {
      altura: Number(l.medida_altura),
      largura: Number(l.medida_largura),
      profundidade: Number(l.medida_profundidade),
    },
    envio: {
      pesoG: l.peso_g,
      caixa: {
        altura: Number(l.caixa_altura),
        largura: Number(l.caixa_largura),
        comprimento: Number(l.caixa_comprimento),
      },
    },
    acabamentos: l.acabamentos,
    imagens: l.imagens,
    ...(l.destaque ? { destaque: true } : {}),
    ...(l.fundo_card ? { fundoCard: l.fundo_card } : {}),
    prazoProducao: l.prazo_producao,
  };
}

const buscarDoBanco = unstable_cache(
  async (): Promise<Produto[] | null> => {
    const { data, error } = await db()
      .from("produtos")
      .select("*, categorias(slug)")
      .eq("ativo", true)
      .order("posicao");

    if (error) {
      // Banco fora do ar não pode derrubar a loja: caímos no arquivo.
      console.error("[catalogo] falha ao ler do banco:", error.message);
      return null;
    }
    return (data as LinhaProduto[]).map(paraProduto);
  },
  ["catalogo-produtos"],
  { tags: [TAG], revalidate: 300 },
);

export async function listarProdutos(): Promise<Produto[]> {
  if (!supabaseConfigurado()) return PRODUTOS_ARQUIVO;
  const doBanco = await buscarDoBanco();
  return doBanco ?? PRODUTOS_ARQUIVO;
}

export async function produtoPorSlug(slug: string) {
  return (await listarProdutos()).find((p) => p.slug === slug);
}

export async function produtosDestaque() {
  return (await listarProdutos()).filter((p) => p.destaque);
}

export async function listarCategorias() {
  if (!supabaseConfigurado()) return CATEGORIAS_ARQUIVO;

  const { data, error } = await db()
    .from("categorias")
    .select("slug,nome,descricao")
    .order("posicao");

  if (error || !data?.length) return CATEGORIAS_ARQUIVO;

  return Object.fromEntries(
    data.map((c) => [c.slug, { nome: c.nome, descricao: c.descricao }]),
  ) as typeof CATEGORIAS_ARQUIVO;
}

/** Chamado pelo painel depois de salvar, para o site refletir na hora. */
export function limparCacheCatalogo() {
  // "max" invalida em todos os perfis de cache — queremos que a mudança de
  // preço apareça para todo mundo imediatamente, sem exceção.
  revalidateTag(TAG, "max");
}
