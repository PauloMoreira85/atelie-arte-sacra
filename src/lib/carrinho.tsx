"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { PRODUTOS, type Produto } from "@/data/produtos";
import { LOJA } from "@/data/loja";

/**
 * Um item é identificado por produto + acabamento: o mesmo busto em dourado e
 * em cobre são duas linhas distintas no carrinho.
 */
export type ItemCarrinho = {
  slug: string;
  acabamento: string;
  quantidade: number;
};

type Estado = { itens: ItemCarrinho[]; carregado: boolean };

type Acao =
  | { tipo: "hidratar"; itens: ItemCarrinho[] }
  | { tipo: "adicionar"; slug: string; acabamento: string; quantidade?: number }
  | { tipo: "remover"; slug: string; acabamento: string }
  | { tipo: "quantidade"; slug: string; acabamento: string; quantidade: number }
  | { tipo: "limpar" };

const CHAVE = "atelie-carrinho-v1";
const mesmaLinha = (i: ItemCarrinho, slug: string, acabamento: string) =>
  i.slug === slug && i.acabamento === acabamento;

function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case "hidratar":
      return { itens: acao.itens, carregado: true };

    case "adicionar": {
      const qtd = acao.quantidade ?? 1;
      const existente = estado.itens.find((i) =>
        mesmaLinha(i, acao.slug, acao.acabamento),
      );
      if (existente) {
        return {
          ...estado,
          itens: estado.itens.map((i) =>
            mesmaLinha(i, acao.slug, acao.acabamento)
              ? { ...i, quantidade: Math.min(i.quantidade + qtd, 99) }
              : i,
          ),
        };
      }
      return {
        ...estado,
        itens: [
          ...estado.itens,
          { slug: acao.slug, acabamento: acao.acabamento, quantidade: qtd },
        ],
      };
    }

    case "remover":
      return {
        ...estado,
        itens: estado.itens.filter(
          (i) => !mesmaLinha(i, acao.slug, acao.acabamento),
        ),
      };

    case "quantidade": {
      if (acao.quantidade < 1) {
        return {
          ...estado,
          itens: estado.itens.filter(
            (i) => !mesmaLinha(i, acao.slug, acao.acabamento),
          ),
        };
      }
      return {
        ...estado,
        itens: estado.itens.map((i) =>
          mesmaLinha(i, acao.slug, acao.acabamento)
            ? { ...i, quantidade: Math.min(acao.quantidade, 99) }
            : i,
        ),
      };
    }

    case "limpar":
      return { ...estado, itens: [] };
  }
}

/** Item do carrinho já cruzado com os dados do produto. */
export type LinhaDetalhada = ItemCarrinho & {
  produto: Produto;
  subtotal: number;
};

type Contexto = {
  itens: ItemCarrinho[];
  linhas: LinhaDetalhada[];
  quantidadeTotal: number;
  subtotal: number;
  frete: number;
  total: number;
  carregado: boolean;
  adicionar: (slug: string, acabamento: string, quantidade?: number) => void;
  remover: (slug: string, acabamento: string) => void;
  mudarQuantidade: (
    slug: string,
    acabamento: string,
    quantidade: number,
  ) => void;
  limpar: () => void;
};

const CarrinhoContext = createContext<Contexto | null>(null);

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, {
    itens: [],
    carregado: false,
  });

  // Carrega do localStorage depois da montagem, para não quebrar a hidratação.
  useEffect(() => {
    let itens: ItemCarrinho[] = [];
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) {
        const lido: unknown = JSON.parse(bruto);
        if (Array.isArray(lido)) {
          // Descarta itens de produtos que saíram do catálogo desde a
          // última visita, senão o carrinho quebra ao cruzar com PRODUTOS.
          itens = lido.filter(
            (i): i is ItemCarrinho =>
              !!i &&
              typeof i.slug === "string" &&
              typeof i.acabamento === "string" &&
              Number.isFinite(i.quantidade) &&
              i.quantidade > 0 &&
              PRODUTOS.some((p) => p.slug === i.slug),
          );
        }
      }
    } catch {
      // localStorage bloqueado ou JSON corrompido: começa vazio.
    }
    dispatch({ tipo: "hidratar", itens });
  }, []);

  useEffect(() => {
    if (!estado.carregado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado.itens));
    } catch {
      // Sem persistência (aba anônima, cota cheia): o carrinho segue na memória.
    }
  }, [estado.itens, estado.carregado]);

  const valor = useMemo<Contexto>(() => {
    const linhas = estado.itens.flatMap<LinhaDetalhada>((item) => {
      const produto = PRODUTOS.find((p) => p.slug === item.slug);
      if (!produto) return [];
      return [{ ...item, produto, subtotal: produto.preco * item.quantidade }];
    });

    const subtotal = linhas.reduce((s, l) => s + l.subtotal, 0);
    const frete =
      subtotal === 0 || subtotal >= LOJA.freteGratisAcima ? 0 : LOJA.freteFixo;

    return {
      itens: estado.itens,
      linhas,
      quantidadeTotal: linhas.reduce((s, l) => s + l.quantidade, 0),
      subtotal,
      frete,
      total: subtotal + frete,
      carregado: estado.carregado,
      adicionar: (slug, acabamento, quantidade) =>
        dispatch({ tipo: "adicionar", slug, acabamento, quantidade }),
      remover: (slug, acabamento) =>
        dispatch({ tipo: "remover", slug, acabamento }),
      mudarQuantidade: (slug, acabamento, quantidade) =>
        dispatch({ tipo: "quantidade", slug, acabamento, quantidade }),
      limpar: () => dispatch({ tipo: "limpar" }),
    };
  }, [estado]);

  return (
    <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) {
    throw new Error("useCarrinho precisa estar dentro de <CarrinhoProvider>");
  }
  return ctx;
}
