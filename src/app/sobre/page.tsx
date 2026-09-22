import type { Metadata } from "next";
import Image from "next/image";
import { LOJA, linkWhatsApp } from "@/data/loja";

export const metadata: Metadata = {
  title: "Sobre o ateliê",
  description:
    "Como nascem as peças do Ateliê Arte Sacra: modelagem, impressão 3D e acabamento à mão.",
};

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Image
        src="/marca/logo.webp"
        alt={LOJA.nome}
        width={260}
        height={260}
        className="mx-auto mb-10 w-52 rounded-xl"
      />

      <h1 className="text-center font-display text-5xl text-creme">
        Sobre o ateliê
      </h1>

      <div className="mt-10 space-y-5 text-[17px] leading-relaxed text-creme-suave">
        <p>
          O Ateliê Arte Sacra nasceu do encontro entre a tecnologia da impressão
          3D e uma tradição muito mais antiga: a de representar em imagem aquilo
          que a gente carrega na fé.
        </p>
        <p>
          Cada peça começa como um modelo tridimensional, ajustado camada por
          camada até que os detalhes — a dobra de um manto, a pena de uma asa, a
          coroa de espinhos — saiam nítidos na impressão. Depois vem a parte que
          nenhuma máquina faz sozinha: o lixamento, a montagem e a conferência,
          peça por peça, na mão.
        </p>
        <p>
          Não trabalhamos com estoque parado. Sua peça começa a ser impressa
          depois que você faz o pedido, e é por isso que cada encomenda leva
          alguns dias até sair daqui. É também por isso que conseguimos fazer
          variações de acabamento e encomendas personalizadas sem complicação.
        </p>
      </div>

      <div className="my-12 filete-ouro" />

      <section>
        <h2 className="font-display text-3xl text-creme">
          Encomendas em quantidade
        </h2>
        <p className="mt-4 leading-relaxed text-creme-suave">
          Fazemos lembrancinhas para batizado, primeira comunhão, crisma e
          casamento, com preço especial a partir de 20 unidades. Se a sua
          paróquia ou família tem uma devoção específica, fale com a gente: na
          maioria dos casos conseguimos modelar a peça.
        </p>
        <a
          href={linkWhatsApp("Olá! Gostaria de falar sobre uma encomenda.")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-full bg-ouro px-8 py-3 text-sm font-medium text-preto transition-colors hover:bg-ouro-claro"
        >
          Falar no WhatsApp
        </a>
      </section>

      <div className="my-12 filete-ouro" />

      <section>
        <h2 className="font-display text-3xl text-creme">Cuidados com a peça</h2>
        <ul className="mt-4 space-y-2 leading-relaxed text-creme-suave">
          <li>
            Limpe com pano seco ou levemente úmido. Não use álcool, acetona ou
            produtos abrasivos no acabamento metálico.
          </li>
          <li>
            Evite deixar a peça dentro do carro fechado ou sob sol direto e
            forte por muitas horas.
          </li>
          <li>
            Nas luminárias, use apenas a base LED que acompanha o produto. Ela
            não esquenta e é segura para deixar ligada à noite.
          </li>
        </ul>
      </section>
    </div>
  );
}
