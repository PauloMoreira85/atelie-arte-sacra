/**
 * CATÁLOGO DE PRODUTOS
 * ────────────────────────────────────────────────────────────────────────────
 * Este é o único arquivo que você precisa editar para mudar a loja.
 *
 * ⚠️  REVISAR: os preços e as medidas abaixo são ESTIMATIVAS que eu inventei
 *     para o site funcionar. Troque pelos valores reais antes de vender.
 *     As peças com medidas confirmadas (vieram nas artes) estão marcadas
 *     com ✅ — as demais seguem como estimativa.
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
  /** Medidas da PEÇA em cm — é o que o cliente lê na página. */
  medidas: { altura: number; largura: number; profundidade: number };
  /**
   * Dados da CAIXA de envio, usados para cotar frete. São diferentes das
   * medidas da peça: incluem a embalagem e o plástico-bolha.
   *
   * ⚠️ REVISAR: pese e meça uma caixa real de cada peça antes de ligar o
   * frete calculado — uma estimativa baixa aqui faz você pagar a diferença
   * do próprio bolso em cada venda.
   *
   * Os Correios cobram pelo maior valor entre o peso real e o peso cubado
   * (altura × largura × comprimento ÷ 6000), então a caixa importa tanto
   * quanto a balança.
   */
  envio: {
    /** Peso da peça embalada, em gramas. */
    pesoG: number;
    /** Medidas da caixa fechada, em cm. */
    caixa: { altura: number; largura: number; comprimento: number };
  };
  /** Cores/acabamentos que o cliente escolhe no pedido. */
  acabamentos: string[];
  imagens: string[];
  /** Aparece com selo de destaque na home. */
  destaque?: boolean;
  /**
   * Cor de fundo do card. Só é necessário se a arte de uma peça NÃO for em
   * fundo preto como as demais — aí o preto viraria uma moldura dura.
   */
  fundoCard?: string;
  /** Dias úteis para produzir. Peça é feita sob encomenda. */
  prazoProducao: number;
};

export type Categoria = "luminarias" | "bustos" | "devocionais";

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
    envio: {
      pesoG: 700, // REVISAR: pesar a caixa real
      caixa: { altura: 28, largura: 23, comprimento: 15 }, // REVISAR
    },
    acabamentos: ["Branco perolado"],
    imagens: ["/produtos/anjo-luminaria.webp"],
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
    envio: {
      pesoG: 450, // REVISAR: pesar a caixa real
      caixa: { altura: 23, largura: 17, comprimento: 19 }, // REVISAR
    },
    acabamentos: ["Branco perolado"],
    imagens: ["/produtos/porta-terco-aparecida.webp"],
    destaque: true,
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
    envio: {
      pesoG: 850, // REVISAR: pesar a caixa real
      caixa: { altura: 26, largura: 20, comprimento: 17 }, // REVISAR
    },
    acabamentos: ["Dourado", "Cobre"],
    imagens: ["/produtos/busto-cristo-dourado.webp"],
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
    envio: {
      pesoG: 950, // REVISAR: pesar a caixa real
      caixa: { altura: 29, largura: 21, comprimento: 18 }, // REVISAR
    },
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
    envio: {
      pesoG: 500, // REVISAR: pesar a caixa real
      caixa: { altura: 30, largura: 30, comprimento: 9 }, // REVISAR
    },
    acabamentos: ["Branco com resplendor dourado"],
    imagens: ["/produtos/divino-espirito-santo.webp"],
    prazoProducao: 5,
  },
  {
    slug: "nossa-senhora-gracas",
    nome: "Nossa Senhora das Graças",
    categoria: "devocionais",
    preco: 16990, // REVISAR
    resumo: "Imagem de mãos abertas, com auréola de estrelas dourada.",
    descricao: [
      "Nossa Senhora das Graças de mãos abertas, no gesto de quem acolhe. O manto cai em pregas finas, trabalhadas uma a uma, e o acabamento perolado dá à peça o brilho suave da madrepérola.",
      "A auréola de doze estrelas é impressa à parte, em dourado, e encaixa na imagem — o contraste entre o perolado e o ouro é o que dá presença à peça mesmo de longe.",
    ],
    medidas: { altura: 19.5, largura: 8, profundidade: 6.5 }, // ✅ confirmado pela arte
    envio: {
      pesoG: 550, // REVISAR: pesar a caixa real
      caixa: { altura: 26, largura: 14, comprimento: 13 }, // REVISAR
    },
    acabamentos: ["Perolado com auréola dourada"],
    imagens: [
      "/produtos/nossa-senhora-gracas.webp",
      "/produtos/nossa-senhora-gracas-medidas.webp",
    ],
    destaque: true,
    prazoProducao: 6,
  },
  {
    slug: "aparecida-vazada",
    nome: "Nossa Senhora Aparecida Vazada",
    categoria: "devocionais",
    preco: 11990, // REVISAR
    resumo: "Silhueta vazada em renda, com coroa e terço em relevo.",
    descricao: [
      "A silhueta de Nossa Senhora Aparecida vazada como uma renda: a coroa, os arabescos do manto e o terço no centro são todos impressos numa peça só, sem emendas nem colagem.",
      "Fica em pé sobre a própria base. Contra uma parede clara ou uma janela, o vazado desenha a sombra da imagem — por isso costuma ficar bonita perto de uma fonte de luz.",
    ],
    medidas: { altura: 18, largura: 14, profundidade: 4 }, // REVISAR
    envio: {
      pesoG: 400, // REVISAR: pesar a caixa real
      caixa: { altura: 24, largura: 20, comprimento: 10 }, // REVISAR
    },
    acabamentos: ["Branco perolado"],
    imagens: ["/produtos/aparecida-vazada.webp"],
    prazoProducao: 4,
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
