/**
 * CATÁLOGO DE PRODUTOS
 * ────────────────────────────────────────────────────────────────────────────
 * Este é o único arquivo que você precisa editar para mudar a loja.
 *
 * ⚠️  REVISAR: os preços e as medidas abaixo são ESTIMATIVAS que eu inventei
 *     para o site funcionar. Troque pelos valores reais antes de vender.
 *     A única peça com medidas confirmadas é o Porta Terço (veio na foto).
 *
 * Preços em CENTAVOS (R$ 149,90 => 14990). Isso evita erro de arredondamento
 * de ponto flutuante no carrinho e é o formato que a Asaas espera receber.
 */

export type Produto = {
  slug: string;
  nome: string;
  categoria: Categoria;
  /** Preço em centavos. REVISAR. */
  preco: number;
  /** Frase curta que aparece no card da grade. */
  resumo: string;
  /** Texto da página do produto. Pode ter vários parágrafos. */
  descricao: string[];
  /** Medidas em cm. REVISAR (exceto porta-terco). */
  medidas: { altura: number; largura: number; profundidade: number };
  /** Cores/acabamentos que o cliente escolhe no pedido. */
  acabamentos: string[];
  imagens: string[];
  /** Aparece com selo de destaque na home. */
  destaque?: boolean;
  /**
   * Cor de fundo do card. Use quando a foto do produto NÃO for em fundo preto
   * (ex: uma arte pronta em fundo claro), senão o preto vira uma moldura dura.
   */
  fundoCard?: string;
  /** Dias úteis para produzir. Peça é feita sob encomenda. */
  prazoProducao: number;
};

export type Categoria = "luminarias" | "bustos" | "devocionais" | "lembrancinhas";

export const CATEGORIAS: Record<Categoria, { nome: string; descricao: string }> = {
  luminarias: {
    nome: "Luminárias",
    descricao: "Peças translúcidas que ganham vida quando acesas.",
  },
  bustos: {
    nome: "Bustos & Esculturas",
    descricao: "Esculturas de mesa com acabamento metálico.",
  },
  devocionais: {
    nome: "Devocionais",
    descricao: "Peças para o altar, o oratório e o cantinho de oração.",
  },
  lembrancinhas: {
    nome: "Lembrancinhas",
    descricao: "Para batizados, casamentos, primeira comunhão e crisma.",
  },
};

export const PRODUTOS: Produto[] = [
  {
    slug: "anjo-luminaria",
    nome: "Anjo Luminária",
    categoria: "luminarias",
    preco: 18990, // REVISAR
    resumo: "Anjo em prece que acende em luz quente ou colorida.",
    descricao: [
      "Um anjo de mãos postas, com as asas abertas e o manto trabalhado em relevo. Apagado, é uma escultura branca de linhas suaves. Aceso, a luz atravessa a peça inteira e revela cada dobra do tecido e cada pena das asas.",
      "Acompanha base com LED de luz quente e também modo RGB, para escolher a cor conforme o ambiente ou a data. Fica bonito na mesa de cabeceira, no oratório ou como luz de presença no quarto das crianças.",
    ],
    medidas: { altura: 22, largura: 17, profundidade: 9 }, // REVISAR
    acabamentos: ["Branco perolado"],
    imagens: [
      "/produtos/anjo-luminaria-acesa.webp",
      "/produtos/anjo-luminaria-rosa.webp",
      "/produtos/anjo-luminaria-azul.webp",
      "/produtos/anjo-luminaria-apagada.webp",
    ],
    destaque: true,
    prazoProducao: 5,
  },
  {
    slug: "porta-terco-aparecida",
    nome: "Porta Terço Virgem Maria",
    categoria: "devocionais",
    preco: 8990, // REVISAR
    resumo: "Nossa Senhora sobre bandeja, para guardar o terço.",
    descricao: [
      "A silhueta de Nossa Senhora Aparecida sobre uma bandeja ondulada, pensada para acomodar o terço ao final da oração. O manto tem o cordão de pérolas em relevo e a coroa vazada é impressa junto à peça, sem emendas.",
      "É a peça que mais sai como presente: cabe na mesa de cabeceira, no console da sala e no cantinho de oração, e chega pronta para embrulhar.",
    ],
    medidas: { altura: 17, largura: 11, profundidade: 13 }, // ✅ confirmado pela foto
    acabamentos: ["Branco perolado"],
    imagens: ["/produtos/porta-terco-aparecida.webp"],
    destaque: true,
    fundoCard: "#f3ece2",
    prazoProducao: 4,
  },
  {
    slug: "busto-cristo-coroado",
    nome: "Busto Cristo Coroado",
    categoria: "bustos",
    preco: 24990, // REVISAR
    resumo: "Cristo de cabeça baixa, com coroa de espinhos.",
    descricao: [
      "Cristo com a cabeça inclinada e a coroa de espinhos entrelaçada aos cabelos. Os fios da barba e do cabelo saem definidos um a um — é a peça que melhor mostra o nível de detalhe que conseguimos na impressão.",
      "O acabamento metálico muda muito com a luz do ambiente: o dourado puxa para o quente e o cobre para o avermelhado. Escolha o acabamento no pedido.",
    ],
    medidas: { altura: 20, largura: 14, profundidade: 11 }, // REVISAR
    acabamentos: ["Dourado", "Cobre"],
    imagens: [
      "/produtos/busto-cristo-dourado.webp",
      "/produtos/busto-cristo-dourado-frontal.webp",
      "/produtos/bustos-duo.webp",
    ],
    destaque: true,
    prazoProducao: 7,
  },
  {
    slug: "busto-cristo-classico",
    nome: "Busto Cristo Clássico",
    categoria: "bustos",
    preco: 26990, // REVISAR
    resumo: "Busto sobre pedestal, com base ornamentada.",
    descricao: [
      "Versão clássica, sobre pedestal torneado e com arabescos em relevo na base do peito. O olhar é frontal e sereno, diferente do Cristo Coroado, que tem a cabeça baixa.",
      "Disponível no acabamento cobre metálico e no cinza mármore, que imita pedra esculpida e combina com ambientes mais sóbrios.",
    ],
    medidas: { altura: 23, largura: 15, profundidade: 12 }, // REVISAR
    acabamentos: ["Cobre", "Cinza mármore"],
    imagens: [
      "/produtos/busto-cristo-cobre.webp",
      "/produtos/busto-cristo-marmore.webp",
    ],
    prazoProducao: 7,
  },
  {
    slug: "divino-espirito-santo",
    nome: "Divino Espírito Santo",
    categoria: "devocionais",
    preco: 13990, // REVISAR
    resumo: "Pomba branca sobre resplendor dourado, de parede.",
    descricao: [
      "A pomba do Divino em branco, aplicada sobre o resplendor de raios dourados. As duas partes são impressas separadamente e montadas por nós, o que dá o contraste limpo entre o branco e o dourado.",
      "Vai na parede com um prego discreto ou apoiado em prateleira. Tradicional acima da porta de entrada, na sala ou no quarto do casal.",
    ],
    medidas: { altura: 24, largura: 24, profundidade: 3 }, // REVISAR
    acabamentos: ["Branco com resplendor dourado"],
    imagens: ["/produtos/divino-espirito-santo.webp"],
    prazoProducao: 5,
  },
  {
    slug: "chaveiro-aparecida",
    nome: "Chaveiro Nossa Senhora Aparecida",
    categoria: "lembrancinhas",
    preco: 1490, // REVISAR
    resumo: "Silhueta vazada em renda. Ideal para lembrancinha.",
    descricao: [
      "A silhueta de Nossa Senhora Aparecida vazada como uma renda, com a coroa, o manto em arabescos e o terço no centro. Leve, fina e resistente, com argola metálica.",
      "É a nossa peça de lembrancinha: sai em quantidade para batizado, primeira comunhão, crisma e casamento. Para encomendas acima de 20 unidades, fale com a gente que fazemos preço de lote.",
    ],
    medidas: { altura: 6, largura: 4, profundidade: 0.4 }, // REVISAR
    acabamentos: ["Branco perolado"],
    imagens: ["/produtos/chaveiro-aparecida.webp"],
    prazoProducao: 3,
  },
];

export const produtoPorSlug = (slug: string) =>
  PRODUTOS.find((p) => p.slug === slug);

export const produtosDestaque = () => PRODUTOS.filter((p) => p.destaque);

/** 14990 -> "R$ 149,90" */
export const formatarPreco = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
