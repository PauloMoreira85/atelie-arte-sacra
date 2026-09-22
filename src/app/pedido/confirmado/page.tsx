import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmacaoCliente } from "./ConfirmacaoCliente";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false },
};

export default function ConfirmadoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <p className="text-creme-fraco">Carregando…</p>
        </div>
      }
    >
      <ConfirmacaoCliente />
    </Suspense>
  );
}
