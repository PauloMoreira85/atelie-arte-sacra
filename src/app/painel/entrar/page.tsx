import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { entrar, usuarioAtual } from "@/lib/painel-auth";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = {
  title: "Entrar no painel",
  robots: { index: false, follow: false },
};

export default async function EntrarPage() {
  // Já logado: vai direto para o painel.
  if (await usuarioAtual()) redirect("/painel");

  async function acaoEntrar(_estado: unknown, dados: FormData) {
    "use server";
    const r = await entrar(
      String(dados.get("usuario") ?? ""),
      String(dados.get("pin") ?? ""),
    );
    if (r.ok) redirect("/painel");
    return { erro: r.erro };
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-20">
      <Image
        src="/marca/simbolo.webp"
        alt=""
        width={64}
        height={64}
        className="mb-6 h-16 w-16 rounded-full object-cover"
        priority
      />

      <h1 className="font-display text-3xl text-creme">Painel do ateliê</h1>
      <p className="mt-2 text-center text-sm text-creme-fraco">
        Entre para gerenciar as peças da loja.
      </p>

      <FormularioEntrar acao={acaoEntrar} />
    </div>
  );
}
