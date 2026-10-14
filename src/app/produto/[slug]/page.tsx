import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompraProduto } from "@/components/CompraProduto";
import { CardProduto } from "@/components/CardProduto";
import { CATEGORIAS } from "@/data/produtos";
import { listarProdutos, produtoPorSlug } from "@/lib/catalogo";
import { LOJA } from "@/data/loja";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listarProdutos()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const produto = await produtoPorSlug(slug);
  if (!produto) return {};

  return {
    title: produto.nome,
    description: produto.resumo,
    openGraph: {
      title: `${produto.nome} · ${LOJA.nome}`,
      description: produto.resumo,
      images: [{ url: produto.imagens[0] }],
    },
  };
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;
  const produto = await produtoPorSlug(slug);
  if (!produto) notFound();

  const relacionados = (await listarProdutos()).filter(
    (p) => p.categoria === produto.categoria && p.slug !== produto.slug,
  ).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <nav className="mb-8 text-sm text-creme-fraco">
        <Link href="/loja" className="hover:text-ouro-claro">
          Loja
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/loja/${produto.categoria}`}
          className="hover:text-ouro-claro"
        >
          {CATEGORIAS[produto.categoria].nome}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-creme-suave">{produto.nome}</span>
      </nav>

      <CompraProduto produto={produto} />

      {relacionados.length > 0 && (
        <section className="mt-24">
          <div className="filete-ouro mb-12" />
          <h2 className="mb-8 font-display text-3xl text-creme">
            Você também pode gostar
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relacionados.map((p) => (
              <CardProduto key={p.slug} produto={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
