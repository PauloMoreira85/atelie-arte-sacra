import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/painel-auth";
import { db } from "@/lib/supabase";
import { FormularioProduto } from "./FormularioProduto";
import { salvarProduto } from "./actions";

export default async function EditarProduto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirLogin();
  const { id } = await params;

  const [{ data: produto }, { data: categorias }] = await Promise.all([
    db().from("produtos").select("*").eq("id", id).maybeSingle(),
    db().from("categorias").select("id,nome").order("posicao"),
  ]);

  if (!produto) notFound();

  const acao = salvarProduto.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-creme-fraco">
        <Link href="/painel" className="hover:text-ouro-claro">
          Painel
        </Link>
        <span className="mx-2">/</span>
        <span className="text-creme-suave">{produto.nome}</span>
      </nav>

      <h1 className="mb-8 font-display text-3xl text-creme">Editar peça</h1>

      <FormularioProduto
        produto={produto}
        categorias={categorias ?? []}
        acao={acao}
      />
    </div>
  );
}
