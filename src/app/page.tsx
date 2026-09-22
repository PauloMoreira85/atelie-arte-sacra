import Link from "next/link";
import Image from "next/image";
import { CardProduto } from "@/components/CardProduto";
import { PRODUTOS, produtosDestaque, CATEGORIAS } from "@/data/produtos";
import { LOJA, linkWhatsApp } from "@/data/loja";

export default function Home() {
  const destaques = produtosDestaque();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ouro/15">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-ouro">
              Impressão 3D · Acabamento à mão
            </p>
            <h1 className="font-display text-5xl leading-[1.08] text-creme sm:text-6xl">
              Arte sacra para
              <br />
              <span className="text-ouro-claro">o seu cantinho de fé</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-creme-suave">
              Luminárias, bustos e devocionais modelados em 3D e acabados peça
              por peça. Cada encomenda é produzida só depois do seu pedido.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/loja"
                className="rounded-full bg-ouro px-8 py-3 text-sm font-medium tracking-wide text-preto transition-colors hover:bg-ouro-claro"
              >
                Ver todas as peças
              </Link>
              <a
                href={linkWhatsApp(
                  "Olá! Vim pelo site e gostaria de fazer uma encomenda.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-ouro/40 px-8 py-3 text-sm tracking-wide text-creme transition-colors hover:border-ouro hover:text-ouro-claro"
              >
                Encomenda personalizada
              </a>
            </div>
          </div>

          <div className="relative aspect-square">
            <div className="halo-ouro absolute inset-0 scale-125" />
            <Image
              src="/produtos/anjo-luminaria-acesa.webp"
              alt="Anjo Luminária acesa, em luz quente"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl text-creme">As mais pedidas</h2>
          <p className="mt-3 text-creme-fraco">
            As peças que mais saem do ateliê.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destaques.map((p, i) => (
            <CardProduto key={p.slug} produto={p} prioridade={i === 0} />
          ))}
        </div>
      </section>

      <div className="filete-ouro" />

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="mb-12 text-center font-display text-4xl text-creme">
          Como funciona
        </h2>

        <ol className="grid gap-10 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Você escolhe",
              d: "Escolhe a peça, o acabamento e fecha o pedido pelo site, com Pix ou cartão.",
            },
            {
              n: "02",
              t: "A gente imprime",
              d: "A peça entra na fila de impressão e é feita só para você, camada por camada.",
            },
            {
              n: "03",
              t: "Acabamento e envio",
              d: "Lixamos, montamos e conferimos cada detalhe antes de embalar e despachar.",
            },
          ].map((passo) => (
            <li key={passo.n}>
              <span className="font-display text-4xl text-ouro/50">
                {passo.n}
              </span>
              <h3 className="mt-3 text-xl text-creme">{passo.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-creme-fraco">
                {passo.d}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Categorias */}
      <section className="border-y border-ouro/15 bg-carvao">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="mb-10 text-center font-display text-4xl text-creme">
            Navegue por categoria
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(CATEGORIAS).map(([slug, c]) => {
              const quantas = PRODUTOS.filter(
                (p) => p.categoria === slug,
              ).length;
              return (
                <Link
                  key={slug}
                  href={`/loja/${slug}`}
                  className="rounded-xl border border-ouro/15 p-6 transition-colors hover:border-ouro/45"
                >
                  <h3 className="font-display text-2xl text-ouro-claro">
                    {c.nome}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-creme-fraco">
                    {c.descricao}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-widest text-creme-fraco">
                    {quantas} {quantas === 1 ? "peça" : "peças"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Encomendas */}
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-4xl text-creme">
          Quer uma peça personalizada?
        </h2>
        <p className="mt-4 leading-relaxed text-creme-suave">
          Fazemos lembrancinhas em quantidade para batizado, casamento, primeira
          comunhão e crisma — e também o santo de devoção da sua família.
        </p>
        <a
          href={linkWhatsApp(
            "Olá! Gostaria de um orçamento para uma encomenda personalizada.",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-full bg-ouro px-8 py-3 text-sm font-medium tracking-wide text-preto transition-colors hover:bg-ouro-claro"
        >
          Pedir orçamento no WhatsApp
        </a>
        <p className="mt-4 text-sm text-creme-fraco">{LOJA.cidade}</p>
      </section>
    </>
  );
}
