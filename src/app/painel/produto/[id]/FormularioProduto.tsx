"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { EstadoSalvar } from "./actions";

type Produto = {
  nome: string;
  preco: number;
  resumo: string;
  descricao: string[];
  medida_altura: number;
  medida_largura: number;
  medida_profundidade: number;
  peso_g: number;
  caixa_altura: number;
  caixa_largura: number;
  caixa_comprimento: number;
  acabamentos: string[];
  imagens: string[];
  destaque: boolean;
  ativo: boolean;
  prazo_producao: number;
  categoria_id: string | null;
};

const campo =
  "w-full rounded-lg border border-ouro/25 bg-preto px-3 py-2 text-sm text-creme placeholder:text-creme-fraco/50 focus:border-ouro focus:outline-none";

function Rotulo({
  children,
  dica,
}: {
  children: React.ReactNode;
  dica?: string;
}) {
  return (
    <span className="mb-1 block">
      <span className="block text-xs text-creme-fraco">{children}</span>
      {dica && <span className="block text-xs text-creme-fraco/70">{dica}</span>}
    </span>
  );
}

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ouro px-8 py-3 text-sm font-medium text-preto transition-colors hover:bg-ouro-claro disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Salvar alterações"}
    </button>
  );
}

export function FormularioProduto({
  produto,
  categorias,
  acao,
}: {
  produto: Produto;
  categorias: { id: string; nome: string }[];
  acao: (estado: EstadoSalvar, dados: FormData) => Promise<EstadoSalvar>;
}) {
  const [estado, formAction] = useActionState(acao, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <label className="block">
        <Rotulo>Nome da peça</Rotulo>
        <input name="nome" defaultValue={produto.nome} required className={campo} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <Rotulo dica="Em reais, ex: 189,90">Preço</Rotulo>
          <input
            name="preco"
            defaultValue={(produto.preco / 100).toFixed(2).replace(".", ",")}
            inputMode="decimal"
            required
            className={campo}
          />
        </label>

        <label className="block">
          <Rotulo>Categoria</Rotulo>
          <select
            name="categoria_id"
            defaultValue={produto.categoria_id ?? ""}
            className={campo}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <Rotulo dica="A frase curta que aparece no card da loja">Resumo</Rotulo>
        <input name="resumo" defaultValue={produto.resumo} className={campo} />
      </label>

      <label className="block">
        <Rotulo dica="Deixe uma linha em branco entre os parágrafos">
          Descrição
        </Rotulo>
        <textarea
          name="descricao"
          defaultValue={produto.descricao.join("\n\n")}
          rows={8}
          className={campo}
        />
      </label>

      <label className="block">
        <Rotulo dica="Como a peça é feita, ex: Mármore, dourado e vermelho. Só use mais de uma LINHA se a peça for produzida em versões diferentes — aí o cliente escolhe.">
          Acabamento
        </Rotulo>
        <textarea
          name="acabamentos"
          defaultValue={produto.acabamentos.join("\n")}
          rows={2}
          required
          className={campo}
        />
      </label>

      <label className="block">
        <Rotulo dica="Um caminho por linha, ex: /produtos/anjo-luminaria.webp">
          Imagens
        </Rotulo>
        <textarea
          name="imagens"
          defaultValue={produto.imagens.join("\n")}
          rows={3}
          required
          className={`${campo} font-mono text-xs`}
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm uppercase tracking-widest text-ouro-claro">
          Medidas da peça (cm)
        </legend>
        <p className="mb-3 text-xs text-creme-fraco">
          É o que o cliente lê na página do produto.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["medida_altura", "Altura", produto.medida_altura],
              ["medida_largura", "Largura", produto.medida_largura],
              ["medida_profundidade", "Profundidade", produto.medida_profundidade],
            ] as const
          ).map(([nome, rotulo, valor]) => (
            <label key={nome} className="block">
              <Rotulo>{rotulo}</Rotulo>
              <input
                name={nome}
                defaultValue={String(valor).replace(".", ",")}
                inputMode="decimal"
                className={campo}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm uppercase tracking-widest text-ouro-claro">
          Caixa de envio
        </legend>
        <p className="mb-3 text-xs text-creme-fraco">
          Da caixa fechada, com a embalagem — é isso que calcula o frete. Os
          Correios cobram pelo maior valor entre o peso real e o cubado
          (A × L × C ÷ 6000), então medir a mais sai caro, e a menos sai do seu
          bolso.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="block">
            <Rotulo dica="gramas">Peso</Rotulo>
            <input
              name="peso_g"
              defaultValue={produto.peso_g}
              inputMode="numeric"
              required
              className={campo}
            />
          </label>
          {(
            [
              ["caixa_altura", "Altura", produto.caixa_altura],
              ["caixa_largura", "Largura", produto.caixa_largura],
              ["caixa_comprimento", "Compr.", produto.caixa_comprimento],
            ] as const
          ).map(([nome, rotulo, valor]) => (
            <label key={nome} className="block">
              <Rotulo dica="cm">{rotulo}</Rotulo>
              <input
                name={nome}
                defaultValue={String(valor).replace(".", ",")}
                inputMode="decimal"
                className={campo}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block max-w-[12rem]">
        <Rotulo dica="dias úteis">Prazo de produção</Rotulo>
        <input
          name="prazo_producao"
          defaultValue={produto.prazo_producao}
          inputMode="numeric"
          className={campo}
        />
      </label>

      <div className="space-y-3 border-t border-ouro/15 pt-5">
        <label className="flex items-center gap-3 text-sm text-creme-suave">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={produto.ativo}
            className="h-4 w-4 accent-[var(--color-ouro)]"
          />
          Peça visível na loja
        </label>
        <label className="flex items-center gap-3 text-sm text-creme-suave">
          <input
            type="checkbox"
            name="destaque"
            defaultChecked={produto.destaque}
            className="h-4 w-4 accent-[var(--color-ouro)]"
          />
          Mostrar na home, em “As mais pedidas”
        </label>
      </div>

      {estado?.erro && (
        <p
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
          role="alert"
        >
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p
          className="rounded-lg border border-ouro/40 bg-ouro/10 p-3 text-sm text-ouro-claro"
          role="status"
        >
          Salvo! A loja já está mostrando a alteração.
        </p>
      )}

      <div className="flex items-center gap-4">
        <Salvar />
        <Link
          href="/painel"
          className="text-sm text-creme-fraco underline underline-offset-4 hover:text-ouro-claro"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}
