"use client";

import { useState } from "react";
import { useCarrinho, type FreteEscolhido } from "@/lib/carrinho";
import { formatarPreco } from "@/data/produtos";
import { LOJA } from "@/data/loja";

type Opcao = Omit<FreteEscolhido, "estimado" | "cep">;

const mascaraCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export function CalculadoraFrete() {
  const { linhas, subtotal, freteEscolhido, definirFrete } = useCarrinho();

  const [cep, setCep] = useState("");
  const [opcoes, setOpcoes] = useState<Opcao[] | null>(null);
  const [estimado, setEstimado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const temFreteGratis = subtotal >= LOJA.freteGratisAcima;

  async function calcular(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    const digitos = cep.replace(/\D/g, "");
    if (digitos.length !== 8) {
      setErro("Digite um CEP com 8 dígitos.");
      return;
    }

    setCarregando(true);
    setOpcoes(null);

    try {
      const resposta = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: digitos,
          itens: linhas.map((l) => ({
            slug: l.slug,
            quantidade: l.quantidade,
          })),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados?.erro ?? "Não foi possível calcular o frete.");
        return;
      }

      setOpcoes(dados.opcoes);
      setEstimado(Boolean(dados.estimado));

      // Pré-seleciona a opção mais barata, que é a primeira da lista.
      const primeira: Opcao | undefined = dados.opcoes?.[0];
      if (primeira) {
        definirFrete({
          ...primeira,
          estimado: Boolean(dados.estimado),
          cep: digitos,
        });
      }
    } catch {
      setErro("Falha de conexão ao calcular o frete. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm uppercase tracking-widest text-ouro-claro">
        Entrega
      </p>

      {temFreteGratis ? (
        <p className="rounded-lg border border-ouro/30 bg-ouro/5 p-3 text-sm text-creme-suave">
          Seu pedido tem <strong className="text-ouro-claro">frete grátis</strong>.
          O endereço de entrega é pedido na página de pagamento.
        </p>
      ) : (
        <>
          <form onSubmit={calcular} className="flex gap-2">
            <input
              value={cep}
              onChange={(e) => setCep(mascaraCep(e.target.value))}
              placeholder="Seu CEP"
              inputMode="numeric"
              autoComplete="postal-code"
              aria-label="CEP para calcular o frete"
              className="w-full rounded-lg border border-ouro/25 bg-preto px-3 py-2 text-sm text-creme placeholder:text-creme-fraco/60 focus:border-ouro focus:outline-none"
            />
            <button
              type="submit"
              disabled={carregando}
              className="shrink-0 rounded-lg border border-ouro/40 px-4 py-2 text-sm text-creme transition-colors hover:border-ouro hover:text-ouro-claro disabled:opacity-60"
            >
              {carregando ? "…" : "Calcular"}
            </button>
          </form>

          {erro && (
            <p className="mt-2 text-sm text-red-300" role="alert">
              {erro}
            </p>
          )}

          {opcoes && opcoes.length > 0 && (
            <ul className="mt-3 space-y-2">
              {opcoes.map((o) => {
                const ativa = freteEscolhido?.id === o.id;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() =>
                        definirFrete({
                          ...o,
                          estimado,
                          cep: cep.replace(/\D/g, ""),
                        })
                      }
                      aria-pressed={ativa}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        ativa
                          ? "border-ouro bg-ouro/10"
                          : "border-ouro/20 hover:border-ouro/50"
                      }`}
                    >
                      <span>
                        <span className="text-creme">{o.nome}</span>
                        <span className="block text-xs text-creme-fraco">
                          {o.prazoDias} dias úteis após a produção
                        </span>
                      </span>
                      <span className="text-ouro-claro">
                        {formatarPreco(o.preco)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {opcoes && estimado && (
            <p className="mt-2 text-xs text-creme-fraco">
              Valor estimado. O frete exato é confirmado quando combinarmos o
              envio com você.
            </p>
          )}
        </>
      )}
    </div>
  );
}
