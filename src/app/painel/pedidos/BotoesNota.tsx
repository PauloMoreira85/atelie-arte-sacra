"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { EstadoEmissao } from "./actions";

/**
 * Botões de nota fiscal de um pedido.
 *
 * Fica num componente de cliente porque precisa de estado: a emissão demora
 * alguns segundos (vai ao Base e espera a SEFAZ), e sem o "Emitindo…" dá a
 * impressão de que o clique não funcionou — e a pessoa clica de novo.
 */

function Botao({ texto, carregando }: { texto: string; carregando: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-ouro/40 px-4 py-1.5 text-xs text-ouro-claro transition-colors hover:bg-ouro/10 disabled:opacity-50"
    >
      {pending ? carregando : texto}
    </button>
  );
}

export function BotoesNota({
  referencia,
  jaEnviado,
  emitir,
  atualizar,
}: {
  referencia: string;
  /** Já existe pedido no Base — então "Atualizar" faz sentido. */
  jaEnviado: boolean;
  emitir: (referencia: string, estado: EstadoEmissao, dados: FormData) => Promise<EstadoEmissao>;
  atualizar: (referencia: string, estado: EstadoEmissao, dados: FormData) => Promise<EstadoEmissao>;
}) {
  const [estadoEmitir, acaoEmitir] = useActionState(
    emitir.bind(null, referencia),
    undefined as EstadoEmissao,
  );
  const [estadoAtualizar, acaoAtualizar] = useActionState(
    atualizar.bind(null, referencia),
    undefined as EstadoEmissao,
  );

  const estado = estadoEmitir ?? estadoAtualizar;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={acaoEmitir}>
          <Botao texto="Emitir nota" carregando="Emitindo…" />
        </form>
        {jaEnviado && (
          <form action={acaoAtualizar}>
            <Botao texto="Atualizar" carregando="Consultando…" />
          </form>
        )}
      </div>

      {estado?.erro && (
        <p className="text-xs text-red-300" role="alert">
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p className="text-xs text-ouro-claro" role="status">
          {estado.ok}
        </p>
      )}
    </div>
  );
}
