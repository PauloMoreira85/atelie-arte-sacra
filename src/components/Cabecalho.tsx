"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCarrinho } from "@/lib/carrinho";
import { CATEGORIAS } from "@/data/produtos";

const LINKS = [
  { href: "/", rotulo: "Início" },
  { href: "/loja", rotulo: "Loja" },
  ...Object.entries(CATEGORIAS).map(([slug, c]) => ({
    href: `/loja/${slug}`,
    rotulo: c.nome,
  })),
  { href: "/sobre", rotulo: "Sobre" },
];

export function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const { quantidadeTotal, carregado } = useCarrinho();
  const rota = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-ouro/15 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setAberto(false)}
        >
          <Image
            src="/marca/simbolo.webp"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            priority
          />
          <span className="font-display text-lg leading-none tracking-wide text-tinta">
            Ateliê <span className="text-ouro-claro">Arte Sacra</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => {
            const ativo = rota === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm transition-colors hover:text-ouro-claro ${
                  ativo ? "text-ouro-claro" : "text-tinta-suave"
                }`}
              >
                {l.rotulo}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/carrinho"
          className="relative ml-auto flex items-center gap-2 rounded-full border border-ouro/35 px-4 py-2 text-sm text-tinta transition-colors hover:border-ouro hover:text-ouro-claro lg:ml-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6" />
            <circle cx="10" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
          <span className="hidden sm:inline">Carrinho</span>
          {carregado && quantidadeTotal > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ouro px-1 text-xs font-medium text-white">
              {quantidadeTotal}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="text-tinta lg:hidden"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            {aberto ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {aberto && (
        <nav className="border-t border-ouro/15 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setAberto(false)}
                className="border-b border-ouro/10 py-3 text-sm text-tinta-suave last:border-0 hover:text-ouro-claro"
              >
                {l.rotulo}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
