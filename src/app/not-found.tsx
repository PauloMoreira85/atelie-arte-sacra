import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center sm:px-6">
      <p className="font-display text-6xl text-ouro/40">404</p>
      <h1 className="mt-4 font-display text-4xl text-tinta">
        Não encontramos esta página
      </h1>
      <p className="mt-4 text-tinta-suave">
        O link pode estar errado ou a peça pode ter saído do catálogo.
      </p>
      <Link
        href="/loja"
        className="mt-8 inline-block rounded-full bg-ouro px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-ouro-claro"
      >
        Ver as peças
      </Link>
    </div>
  );
}
