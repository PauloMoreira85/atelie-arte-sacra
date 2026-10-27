"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCarrinho } from "@/lib/carrinho";
import { formatarPreco, type Produto } from "@/data/produtos";
import { LOJA } from "@/data/loja";
import {
  adicionarAoCarrinho,
  itemDoProduto,
  verItem,
} from "@/lib/rastreamento";

/**
 * Galeria + quantidade + adicionar ao carrinho.
 * Client component porque mexe no carrinho e troca a imagem em destaque.
 */
export function CompraProduto({ produto }: { produto: Produto }) {
  const { adicionar } = useCarrinho();
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [acabamento, setAcabamento] = useState(produto.acabamentos[0]);
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  // Uma visualização por peça aberta (o ref evita a contagem dupla do
  // StrictMode em desenvolvimento).
  const vistoRastreado = useRef("");
  useEffect(() => {
    if (vistoRastreado.current === produto.slug) return;
    vistoRastreado.current = produto.slug;
    verItem(itemDoProduto(produto));
  }, [produto]);

  const fundo = produto.fundoCard
    ? { backgroundColor: produto.fundoCard }
    : undefined;

  function aoAdicionar() {
    adicionar(produto.slug, acabamento, quantidade);
    adicionarAoCarrinho(itemDoProduto(produto, quantidade, acabamento));
    setAdicionado(true);
    window.setTimeout(() => setAdicionado(false), 2500);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Galeria */}
      <div>
        <div
          className="relative aspect-square overflow-hidden rounded-xl border border-ouro/15 bg-carvao"
          style={fundo}
        >
          {!produto.fundoCard && <div className="halo-ouro absolute inset-0" />}
          {/* Peça ainda sem foto não pode quebrar a página. */}
          {produto.imagens[imagemAtiva] ? (
            <Image
              src={produto.imagens[imagemAtiva]}
              alt={produto.nome}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-creme-fraco/50">
              foto em breve
            </div>
          )}
        </div>

        {produto.imagens.length > 1 && (
          <div className="mt-3 flex gap-3">
            {produto.imagens.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => setImagemAtiva(i)}
                aria-label={`Foto ${i + 1} de ${produto.nome}`}
                aria-current={i === imagemAtiva}
                style={fundo}
                className={`relative h-20 w-20 overflow-hidden rounded-lg border bg-carvao transition-colors ${
                  i === imagemAtiva
                    ? "border-ouro"
                    : "border-ouro/15 hover:border-ouro/50"
                }`}
              >
                <Image
                  src={img.replace(/\.webp$/, "-card.webp")}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compra */}
      <div>
        <h1 className="font-display text-4xl leading-tight text-creme">
          {produto.nome}
        </h1>

        <p className="mt-4 text-3xl text-ouro-claro">
          {formatarPreco(produto.preco)}
        </p>
        <p className="mt-1 text-sm text-creme-fraco">
          em até {LOJA.parcelasMax}x sem juros no cartão · Pix com desconto no
          checkout
        </p>

        <div className="my-7 filete-ouro" />

        <div className="space-y-4 text-[15px] leading-relaxed text-creme-suave">
          {produto.descricao.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>

        {/*
          Quase toda peça tem UM acabamento só: as cores (mármore, dourado,
          vermelho) são como ela foi feita, não opções de escolha. Nesse caso
          a gente informa, não pergunta. Os botões só aparecem na peça que
          realmente é produzida em mais de uma versão.
        */}
        {produto.acabamentos.length === 1 ? (
          <p className="mt-8 text-sm text-creme-suave">
            <span className="uppercase tracking-widest text-ouro-claro">
              Acabamento
            </span>{" "}
            · {produto.acabamentos[0]}
          </p>
        ) : (
          <fieldset className="mt-8">
            <legend className="mb-3 text-sm uppercase tracking-widest text-ouro-claro">
              Escolha o acabamento
            </legend>
            <div className="flex flex-wrap gap-2">
              {produto.acabamentos.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAcabamento(a)}
                  aria-pressed={a === acabamento}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    a === acabamento
                      ? "border-ouro bg-ouro/10 text-ouro-claro"
                      : "border-ouro/25 text-creme-suave hover:border-ouro/60"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-full border border-ouro/25">
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              className="px-4 py-2 text-lg text-creme-suave hover:text-ouro-claro"
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span className="w-10 text-center text-creme" aria-live="polite">
              {quantidade}
            </span>
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.min(99, q + 1))}
              className="px-4 py-2 text-lg text-creme-suave hover:text-ouro-claro"
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={aoAdicionar}
            className="flex-1 rounded-full bg-ouro px-8 py-3 text-sm font-medium tracking-wide text-preto transition-colors hover:bg-ouro-claro sm:flex-none"
          >
            Adicionar ao carrinho
          </button>
        </div>

        <p className="mt-3 h-5 text-sm text-ouro-claro" aria-live="polite">
          {adicionado && (
            <>
              Adicionado!{" "}
              <Link href="/carrinho" className="underline underline-offset-4">
                Ver carrinho
              </Link>
            </>
          )}
        </p>

        <dl className="mt-8 space-y-2 border-t border-ouro/15 pt-6 text-sm">
          <div className="flex gap-2">
            <dt className="text-creme-fraco">Medidas aproximadas:</dt>
            {/*
              Nem toda peça tem profundidade medida — mostrar "× 0 cm" faria
              a peça parecer plana. Sem o valor, exibe só altura × largura.
            */}
            <dd className="text-creme-suave">
              {produto.medidas.altura} × {produto.medidas.largura}
              {produto.medidas.profundidade > 0 &&
                ` × ${produto.medidas.profundidade}`}{" "}
              cm
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-creme-fraco">Produção:</dt>
            <dd className="text-creme-suave">
              {produto.prazoProducao} dias úteis (peça feita sob encomenda)
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
