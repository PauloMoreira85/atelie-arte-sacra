import type { Metadata } from "next";
import { CardProduto } from "@/components/CardProduto";
import { PRODUTOS } from "@/data/produtos";

export const metadata: Metadata = {
  title: "Loja",
  description:
    "Todas as peças do ateliê: luminárias, bustos, devocionais e lembrancinhas em impressão 3D.",
};

export default function LojaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <header className="mb-12 text-center">
        <h1 className="font-display text-5xl text-tinta">Nossas peças</h1>
        <p className="mt-3 text-tinta-fraca">
          Todas feitas sob encomenda, uma a uma.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUTOS.map((p, i) => (
          <CardProduto key={p.slug} produto={p} prioridade={i < 3} />
        ))}
      </div>
    </div>
  );
}
