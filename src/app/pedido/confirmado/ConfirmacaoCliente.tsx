"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCarrinho } from "@/lib/carrinho";
import { LOJA, linkWhatsApp } from "@/data/loja";

export function ConfirmacaoCliente() {
  const { limpar, carregado } = useCarrinho();
  const referencia = useSearchParams().get("ref");

  // O cliente voltou da Asaas pela successUrl: o pedido saiu, então o
  // carrinho pode ser esvaziado.
  useEffect(() => {
    if (carregado) limpar();
  }, [carregado, limpar]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-ouro/40">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-ouro-claro"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 className="font-display text-4xl text-tinta">Pedido recebido!</h1>

      <p className="mt-5 leading-relaxed text-tinta-suave">
        Obrigado pela confiança. Assim que o pagamento for compensado, sua peça
        entra na fila de produção — e a gente te avisa por e-mail e WhatsApp em
        cada etapa.
      </p>

      {referencia && (
        <p className="mt-6 text-sm text-tinta-fraca">
          Número do pedido:{" "}
          <span className="text-ouro-claro">{referencia}</span>
          <br />
          Guarde este número para falar com a gente.
        </p>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/loja"
          className="rounded-full bg-ouro px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-ouro-claro"
        >
          Continuar comprando
        </Link>
        <a
          href={linkWhatsApp(
            referencia
              ? `Olá! Acabei de fazer o pedido ${referencia} pelo site.`
              : "Olá! Acabei de fazer um pedido pelo site.",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-ouro/40 px-8 py-3 text-sm text-tinta transition-colors hover:border-ouro hover:text-ouro-claro"
        >
          Falar no WhatsApp
        </a>
      </div>

      <p className="mt-8 text-xs text-tinta-fraca">
        Dúvidas? {LOJA.email}
      </p>
    </div>
  );
}
