import Link from "next/link";
import Image from "next/image";
import { formatarPreco, type Produto } from "@/data/produtos";

/** Usa a versão -card (quadrada) da primeira imagem do produto. */
const imagemCard = (caminho: string) => caminho.replace(/\.webp$/, "-card.webp");

export function CardProduto({
  produto,
  prioridade = false,
}: {
  produto: Produto;
  prioridade?: boolean;
}) {
  return (
    <Link
      href={`/produto/${produto.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ouro/15 bg-pergaminho transition-colors hover:border-ouro/45"
    >
      <div
        className="relative aspect-square overflow-hidden bg-pergaminho"
        style={
          produto.fundoCard ? { backgroundColor: produto.fundoCard } : undefined
        }
      >
        <div className="halo-ouro absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <Image
          src={imagemCard(produto.imagens[0])}
          alt={produto.nome}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain transition-transform duration-500 group-hover:scale-[1.04]"
          priority={prioridade}
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl text-tinta">{produto.nome}</h3>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-tinta-fraca">
          {produto.resumo}
        </p>

        <div className="mt-4 flex items-baseline justify-between gap-2">
          <span className="text-lg text-ouro-claro">
            {formatarPreco(produto.preco)}
          </span>
          <span className="text-xs text-tinta-fraca group-hover:text-ouro-claro">
            Ver peça →
          </span>
        </div>
      </div>
    </Link>
  );
}
