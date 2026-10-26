"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  capturarOrigem,
  contato,
  paginaVista,
} from "@/lib/rastreamento";

/**
 * Mede a navegação e os cliques no WhatsApp. Os scripts das ferramentas são
 * carregados pelo layout raiz.
 *
 * No App Router a troca de página não recarrega o documento, então o
 * page_view automático das ferramentas só pegaria a primeira página.
 * Por isso o envio é manual, a cada mudança de rota.
 *
 * Segue só o caminho, não a query: assim não precisa de <Suspense> e
 * hidrata junto com o resto, fazendo o page_view sair antes do view_item.
 * As páginas que mudam só a query (?status=, ?ref=) chegam por redirect da
 * Asaas, que recarrega o documento e conta normalmente. Não desenha nada.
 */
export function Rastreamento() {
  const caminho = usePathname();
  // Em desenvolvimento o React roda cada efeito duas vezes; sem isto, cada
  // página contaria em dobro.
  const ultimaPagina = useRef("");

  useEffect(() => {
    if (ultimaPagina.current === caminho) return;
    ultimaPagina.current = caminho;
    capturarOrigem();
    paginaVista();
  }, [caminho]);

  // Os links do WhatsApp estão espalhados em componentes de servidor (home,
  // sobre, rodapé, carrinho...). Um único ouvinte no documento cobre todos,
  // inclusive os que forem criados depois.
  useEffect(() => {
    function aoClicar(evento: MouseEvent) {
      const link = (evento.target as Element | null)?.closest?.(
        'a[href*="wa.me/"]',
      );
      if (!link) return;
      const texto = link.textContent?.trim().replace(/\s+/g, " ") ?? "";
      contato(`${window.location.pathname} · ${texto}`.slice(0, 100));
    }
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, []);

  return null;
}
