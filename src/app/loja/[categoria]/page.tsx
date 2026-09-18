import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardProduto } from "@/components/CardProduto";
import { PRODUTOS, CATEGORIAS, type Categoria } from "@/data/produtos";

type Props = { params: Promise<{ categoria: string }> };

const ehCategoria = (v: string): v is Categoria => v in CATEGORIAS;

export function generateStaticParams() {
  return Object.keys(CATEGORIAS).map((categoria) => ({ categoria }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  if (!ehCategoria(categoria)) return {};
  return {
    title: CATEGORIAS[categoria].nome,
    description: CATEGORIAS[categoria].descricao,
  };
}

export default async function CategoriaPage({ params }: Props) {
  const { categoria } = await params;
  if (!ehCategoria(categoria)) notFound();

  const info = CATEGORIAS[categoria];
  const itens = PRODUTOS.filter((p) => p.categoria === categoria);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <nav className="mb-8 text-sm text-tinta-fraca">
        <Link href="/loja" className="hover:text-ouro-claro">
          Loja
        </Link>
        <span className="mx-2">/</span>
        <span className="text-tinta-suave">{info.nome}</span>
      </nav>

      <header className="mb-12">
        <h1 className="font-display text-5xl text-tinta">{info.nome}</h1>
        <p className="mt-3 text-tinta-fraca">{info.descricao}</p>
      </header>

      {itens.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((p, i) => (
            <CardProduto key={p.slug} produto={p} prioridade={i < 3} />
          ))}
        </div>
      ) : (
        <p className="text-tinta-fraca">
          Ainda não há peças nesta categoria.{" "}
          <Link href="/loja" className="text-ouro-claro underline underline-offset-4">
            Ver todas
          </Link>
        </p>
      )}
    </div>
  );
}
