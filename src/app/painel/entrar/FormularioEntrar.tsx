"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type Estado = { erro?: string } | undefined;

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-ouro px-6 py-3 text-sm font-medium text-preto transition-colors hover:bg-ouro-claro disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function FormularioEntrar({
  acao,
}: {
  acao: (estado: Estado, dados: FormData) => Promise<{ erro: string }>;
}) {
  const [estado, formAction] = useActionState(acao, undefined);

  return (
    <form action={formAction} className="mt-8 w-full space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs text-creme-fraco">Usuário</span>
        <input
          name="usuario"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          className="w-full rounded-lg border border-ouro/25 bg-preto px-3 py-2 text-creme focus:border-ouro focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs text-creme-fraco">
          PIN (6 dígitos)
        </span>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="\d{6}"
          maxLength={6}
          required
          className="w-full rounded-lg border border-ouro/25 bg-preto px-3 py-2 text-center text-2xl tracking-[0.5em] text-creme focus:border-ouro focus:outline-none"
        />
      </label>

      {estado?.erro && (
        <p
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
          role="alert"
        >
          {estado.erro}
        </p>
      )}

      <Botao />
    </form>
  );
}
