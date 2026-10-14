import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { exigirLogin, sair } from "@/lib/painel-auth";
import { db } from "@/lib/supabase";
import { formatarPreco } from "@/data/produtos";

type Linha = {
  id: string;
  slug: string;
  nome: string;
  preco: number;
  ativo: boolean;
  destaque: boolean;
  imagens: string[];
  posicao: number;
  categorias: { nome: string } | null;
};

export default async function PainelPage() {
  const usuario = await exigirLogin();

  const { data } = await db()
    .from("produtos")
    .select("id,slug,nome,preco,ativo,destaque,imagens,posicao,categorias(nome)")
    .order("posicao");

  const produtos = (data ?? []) as unknown as Linha[];

  async function acaoSair() {
    "use server";
    await sair();
    redirect("/painel/entrar");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-creme">Peças da loja</h1>
          <p className="mt-1 text-sm text-creme-fraco">
            Olá, {usuario.nome}.{" "}
            <Link href="/" className="underline underline-offset-4 hover:text-ouro-claro">
              ver a loja
            </Link>
          </p>
        </div>

        <form action={acaoSair}>
          <button
            type="submit"
            className="rounded-full border border-ouro/30 px-4 py-2 text-sm text-creme-suave transition-colors hover:border-ouro hover:text-ouro-claro"
          >
            Sair
          </button>
        </form>
      </header>

      <ul className="space-y-3">
        {produtos.map((p) => (
          <li key={p.id}>
            <Link
              href={`/painel/produto/${p.id}`}
              className="flex items-center gap-4 rounded-xl border border-ouro/15 bg-carvao p-3 transition-colors hover:border-ouro/45"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-preto">
                {p.imagens[0] && (
                  <Image
                    src={p.imagens[0].replace(/\.webp$/, "-card.webp")}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-creme">{p.nome}</p>
                <p className="text-xs text-creme-fraco">
                  {p.categorias?.nome ?? "sem categoria"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {p.destaque && (
                  <span className="hidden rounded-full border border-ouro/30 px-2 py-0.5 text-xs text-ouro-claro sm:inline">
                    destaque
                  </span>
                )}
                {!p.ativo && (
                  <span className="rounded-full border border-creme-fraco/30 px-2 py-0.5 text-xs text-creme-fraco">
                    oculta
                  </span>
                )}
                <span className="text-ouro-claro">{formatarPreco(p.preco)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {produtos.length === 0 && (
        <p className="rounded-xl border border-ouro/15 p-6 text-center text-creme-fraco">
          Nenhuma peça cadastrada ainda.
        </p>
      )}
    </div>
  );
}
