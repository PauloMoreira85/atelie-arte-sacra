"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Tarja que aparece no topo do site apenas para quem está logado no painel.
 *
 * Serve para dois casos reais: lembrar que a sessão está aberta (importante
 * num computador compartilhado) e dar um atalho para o painel sem precisar
 * procurar o link no rodapé. Para o visitante comum não renderiza nada.
 *
 * ⚠️ Por que isso roda no browser e não no servidor:
 * ler o cookie durante a renderização torna TODAS as páginas do site
 * dinâmicas — a loja inteira passaria a ser montada a cada visita, mais
 * lenta e mais cara, por causa de uma barra que quase ninguém vê. Tentei
 * isolar com <Suspense> e não resolveu: basta a dependência de requisição
 * existir na árvore para o Next tirar o site do modo estático.
 *
 * Buscando pelo browser, o site continua estático para todo mundo e só quem
 * está logado faz essa consulta extra.
 */
export function BarraPainel() {
  const [nome, setNome] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    fetch("/api/painel/sessao")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (ativo && d?.logado) setNome(d.nome);
      })
      .catch(() => {
        // Visitante comum ou rede instável: a barra simplesmente não aparece.
      });

    return () => {
      ativo = false;
    };
  }, []);

  if (!nome) return null;

  return (
    <div className="border-b border-ouro/20 bg-ouro/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs sm:px-6">
        <span className="text-creme-suave">
          Logado como <strong className="text-ouro-claro">{nome}</strong>
        </span>

        <Link
          href="/painel"
          className="text-creme-suave underline underline-offset-4 transition-colors hover:text-ouro-claro"
        >
          ir para o painel
        </Link>

        <a
          href="/painel/sair"
          className="ml-auto text-creme-fraco underline underline-offset-4 transition-colors hover:text-ouro-claro"
        >
          sair
        </a>
      </div>
    </div>
  );
}
