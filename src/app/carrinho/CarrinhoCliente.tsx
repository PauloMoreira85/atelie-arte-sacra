"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/data/produtos";
import { LOJA, linkWhatsApp } from "@/data/loja";

type Cliente = {
  nome: string;
  email: string;
  telefone: string;
  cpfCnpj: string;
};

const VAZIO: Cliente = { nome: "", email: "", telefone: "", cpfCnpj: "" };

/** (11) 98765-4321 */
function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 123.456.789-09 ou 12.345.678/0001-95 */
function mascaraDocumento(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function CarrinhoCliente() {
  const {
    linhas,
    subtotal,
    frete,
    total,
    carregado,
    mudarQuantidade,
    remover,
  } = useCarrinho();

  const parametros = useSearchParams();
  const statusRetorno = parametros.get("status");

  const [cliente, setCliente] = useState<Cliente>(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const campo = (chave: keyof Cliente) => (valor: string) =>
    setCliente((c) => ({ ...c, [chave]: valor }));

  async function finalizar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: linhas.map((l) => ({
            slug: l.slug,
            acabamento: l.acabamento,
            quantidade: l.quantidade,
          })),
          cliente,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados?.erro ?? "Não foi possível abrir o pagamento.");
        setEnviando(false);
        return;
      }

      // O carrinho só é limpo depois do pagamento confirmado (na página de
      // retorno), para o cliente não perder os itens se desistir no checkout.
      window.location.href = dados.link;
    } catch {
      setErro(
        "Falha de conexão. Verifique sua internet e tente de novo, ou finalize pelo WhatsApp.",
      );
      setEnviando(false);
    }
  }

  // Evita piscar "carrinho vazio" antes de ler o localStorage.
  if (!carregado) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <p className="text-tinta-fraca">Carregando…</p>
      </div>
    );
  }

  if (linhas.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-4xl text-tinta">
          Seu carrinho está vazio
        </h1>
        {statusRetorno === "cancelado" && (
          <p className="mt-4 text-tinta-suave">
            O pagamento foi cancelado. Você pode montar o pedido de novo quando
            quiser.
          </p>
        )}
        <Link
          href="/loja"
          className="mt-8 inline-block rounded-full bg-ouro px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-ouro-claro"
        >
          Ver as peças
        </Link>
      </div>
    );
  }

  const resumoWhatsApp = [
    "Olá! Quero fechar este pedido:",
    "",
    ...linhas.map(
      (l) =>
        `• ${l.quantidade}x ${l.produto.nome} (${l.acabamento}) — ${formatarPreco(l.subtotal)}`,
    ),
    "",
    `Total: ${formatarPreco(total)}`,
  ].join("\n");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="mb-10 font-display text-4xl text-tinta">Seu carrinho</h1>

      {statusRetorno === "expirado" && (
        <p className="mb-8 rounded-lg border border-ouro/30 bg-ouro/5 p-4 text-sm text-tinta-suave">
          O prazo do pagamento anterior expirou. Seus itens continuam aqui —
          é só finalizar de novo.
        </p>
      )}
      {statusRetorno === "cancelado" && (
        <p className="mb-8 rounded-lg border border-ouro/30 bg-ouro/5 p-4 text-sm text-tinta-suave">
          Pagamento cancelado. Seus itens continuam no carrinho.
        </p>
      )}

      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        {/* Itens */}
        <ul className="space-y-4">
          {linhas.map((linha) => (
            <li
              key={`${linha.slug}-${linha.acabamento}`}
              className="flex gap-4 rounded-xl border border-ouro/15 bg-pergaminho p-4"
            >
              <Link
                href={`/produto/${linha.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-creme"
              >
                <Image
                  src={linha.produto.imagens[0].replace(
                    /\.webp$/,
                    "-card.webp",
                  )}
                  alt={linha.produto.nome}
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              </Link>

              <div className="flex flex-1 flex-col">
                <Link
                  href={`/produto/${linha.slug}`}
                  className="font-display text-xl text-tinta hover:text-ouro-claro"
                >
                  {linha.produto.nome}
                </Link>
                <p className="text-sm text-tinta-fraca">{linha.acabamento}</p>

                <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
                  <div className="flex items-center rounded-full border border-ouro/25">
                    <button
                      type="button"
                      onClick={() =>
                        mudarQuantidade(
                          linha.slug,
                          linha.acabamento,
                          linha.quantidade - 1,
                        )
                      }
                      className="px-3 py-1 text-tinta-suave hover:text-ouro-claro"
                      aria-label={`Diminuir ${linha.produto.nome}`}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm text-tinta">
                      {linha.quantidade}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        mudarQuantidade(
                          linha.slug,
                          linha.acabamento,
                          linha.quantidade + 1,
                        )
                      }
                      className="px-3 py-1 text-tinta-suave hover:text-ouro-claro"
                      aria-label={`Aumentar ${linha.produto.nome}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remover(linha.slug, linha.acabamento)}
                    className="text-xs text-tinta-fraca underline underline-offset-4 hover:text-ouro-claro"
                  >
                    Remover
                  </button>

                  <span className="ml-auto text-ouro-claro">
                    {formatarPreco(linha.subtotal)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Resumo + dados */}
        <aside className="h-fit rounded-xl border border-ouro/20 bg-pergaminho p-6">
          <h2 className="font-display text-2xl text-tinta">Resumo</h2>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-tinta-fraca">Subtotal</dt>
              <dd className="text-tinta-suave">{formatarPreco(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-tinta-fraca">Frete</dt>
              <dd className="text-tinta-suave">
                {frete === 0 ? "Grátis" : formatarPreco(frete)}
              </dd>
            </div>
          </dl>

          {frete > 0 && (
            <p className="mt-3 text-xs text-tinta-fraca">
              Faltam {formatarPreco(LOJA.freteGratisAcima - subtotal)} para o
              frete grátis.
            </p>
          )}

          <div className="my-5 filete-ouro" />

          <div className="flex items-baseline justify-between">
            <span className="text-tinta">Total</span>
            <span className="text-2xl text-ouro-claro">
              {formatarPreco(total)}
            </span>
          </div>

          <form onSubmit={finalizar} className="mt-7 space-y-3">
            <p className="text-sm uppercase tracking-widest text-ouro-claro">
              Seus dados
            </p>

            <Campo
              rotulo="Nome completo"
              valor={cliente.nome}
              aoMudar={campo("nome")}
              autoComplete="name"
            />
            <Campo
              rotulo="E-mail"
              tipo="email"
              valor={cliente.email}
              aoMudar={campo("email")}
              autoComplete="email"
            />
            <Campo
              rotulo="Telefone"
              tipo="tel"
              valor={cliente.telefone}
              aoMudar={(v) => campo("telefone")(mascaraTelefone(v))}
              autoComplete="tel"
              placeholder="(11) 98765-4321"
            />
            <Campo
              rotulo="CPF ou CNPJ"
              valor={cliente.cpfCnpj}
              aoMudar={(v) => campo("cpfCnpj")(mascaraDocumento(v))}
              placeholder="000.000.000-00"
            />

            <p className="pt-1 text-xs leading-relaxed text-tinta-fraca">
              O endereço de entrega é pedido na etapa seguinte, na página segura
              de pagamento.
            </p>

            {erro && (
              <p
                className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-full bg-ouro px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-ouro-claro disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Abrindo pagamento…" : "Ir para o pagamento"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-tinta-fraca">
            Pix, cartão em até 6x ou boleto.
          </p>

          <div className="my-5 filete-ouro" />

          <a
            href={linkWhatsApp(resumoWhatsApp)}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-full border border-ouro/35 px-6 py-3 text-center text-sm text-tinta transition-colors hover:border-ouro hover:text-ouro-claro"
          >
            Prefiro fechar pelo WhatsApp
          </a>
        </aside>
      </div>
    </div>
  );
}

function Campo({
  rotulo,
  valor,
  aoMudar,
  tipo = "text",
  autoComplete,
  placeholder,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  tipo?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-tinta-fraca">{rotulo}</span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-lg border border-ouro/25 bg-creme px-3 py-2 text-sm text-tinta placeholder:text-tinta-fraca/60 focus:border-ouro focus:outline-none"
      />
    </label>
  );
}
