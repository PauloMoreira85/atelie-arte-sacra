/**
 * CAIXAS DE ENVIO
 * ────────────────────────────────────────────────────────────────────────────
 * São as duas caixas que a loja realmente tem. O frete é cotado com elas,
 * não com uma caixa por peça.
 *
 * Por que importa: o Melhor Envio cobra por VOLUME despachado. Cotando uma
 * caixa por peça, um pedido de duas peças virava dois volumes e o cliente
 * pagava dois fretes — quando na prática as duas vão na mesma caixa maior.
 *
 * As peças entram na diagonal. A base de 20 × 20 tem 28,3 cm de diagonal,
 * então mesmo a maior peça (Jesus na Cruz, 26 cm) passa.
 */

export type Caixa = {
  nome: string;
  /** Medidas externas em cm. */
  altura: number;
  largura: number;
  comprimento: number;
  /** Quantas peças cabem dentro. */
  capacidade: number;
  /** Peso da caixa vazia com o plástico-bolha, em gramas. ✅ pesado. */
  taraG: number;
};

export const CAIXA_MENOR: Caixa = {
  nome: "Caixa menor",
  altura: 10,
  largura: 20,
  comprimento: 20,
  capacidade: 1,
  taraG: 100,
};

export const CAIXA_MAIOR: Caixa = {
  nome: "Caixa maior",
  altura: 20,
  largura: 20,
  comprimento: 20,
  capacidade: 2,
  taraG: 130,
};

/** Volume a despachar: uma caixa e o que vai dentro dela. */
export type Volume = { caixa: Caixa; pecas: number; pesoG: number };

/**
 * Distribui as peças nas caixas disponíveis.
 *
 * Regra: enche caixas maiores (2 peças cada) e, se sobrar uma, ela vai na
 * menor. Uma peça sozinha nunca viaja na caixa grande — pagaria peso cubado
 * de 20 × 20 × 20 (1,33 kg) em vez de 20 × 20 × 10 (667 g).
 *
 * `pesosG` é o peso de cada peça do pedido, uma entrada por unidade.
 */
export function montarVolumes(pesosG: number[]): Volume[] {
  if (pesosG.length === 0) return [];

  // Mais pesadas primeiro só para distribuir o peso de forma parelha entre
  // as caixas — não muda a quantidade de volumes nem o preço.
  const pesos = [...pesosG].sort((a, b) => b - a);
  const volumes: Volume[] = [];

  for (let i = 0; i < pesos.length; i += CAIXA_MAIOR.capacidade) {
    const lote = pesos.slice(i, i + CAIXA_MAIOR.capacidade);
    const caixa = lote.length === 1 ? CAIXA_MENOR : CAIXA_MAIOR;
    volumes.push({
      caixa,
      pecas: lote.length,
      pesoG: lote.reduce((s, p) => s + p, 0) + caixa.taraG,
    });
  }

  return volumes;
}
