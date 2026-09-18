import type { Metadata } from "next";
import { Suspense } from "react";
import { CarrinhoCliente } from "./CarrinhoCliente";

export const metadata: Metadata = {
  title: "Carrinho",
  robots: { index: false },
};

export default function CarrinhoPage() {
  // useSearchParams (usado para ler ?status=) exige um limite de Suspense.
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="text-tinta-fraca">Carregando…</p>
        </div>
      }
    >
      <CarrinhoCliente />
    </Suspense>
  );
}
