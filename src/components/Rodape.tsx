import Link from "next/link";
import Image from "next/image";
import { LOJA, linkWhatsApp } from "@/data/loja";
import { CATEGORIAS } from "@/data/produtos";

export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-ouro/15 bg-carvao">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Image
            src="/marca/logo.webp"
            alt={LOJA.nome}
            width={220}
            height={220}
            className="mb-4 w-44 rounded-lg"
          />
          <p className="max-w-xs text-sm leading-relaxed text-creme-fraco">
            {LOJA.descricao}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm uppercase tracking-widest text-ouro-claro">
            Categorias
          </h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(CATEGORIAS).map(([slug, c]) => (
              <li key={slug}>
                <Link
                  href={`/loja/${slug}`}
                  className="text-creme-suave transition-colors hover:text-ouro-claro"
                >
                  {c.nome}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/sobre"
                className="text-creme-suave transition-colors hover:text-ouro-claro"
              >
                Sobre o ateliê
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm uppercase tracking-widest text-ouro-claro">
            Contato
          </h3>
          <ul className="space-y-2 text-sm text-creme-suave">
            <li>
              <a
                href={linkWhatsApp("Olá! Vim pelo site e gostaria de saber mais.")}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-ouro-claro"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={`https://instagram.com/${LOJA.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-ouro-claro"
              >
                @{LOJA.instagram}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${LOJA.email}`}
                className="transition-colors hover:text-ouro-claro"
              >
                {LOJA.email}
              </a>
            </li>
            <li className="pt-2 text-creme-fraco">{LOJA.cidade}</li>
          </ul>
        </div>
      </div>

      <div className="filete-ouro" />

      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-creme-fraco sm:px-6">
        <p>
          © {ano} {LOJA.nome}. Peças feitas sob encomenda, uma a uma.
        </p>
      </div>
    </footer>
  );
}
