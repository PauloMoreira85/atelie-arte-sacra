/**
 * CONFIGURAÇÕES DA LOJA
 * ────────────────────────────────────────────────────────────────────────────
 * ⚠️  REVISAR: tudo marcado com TROCAR são placeholders.
 *     Veja o COMO-EDITAR.md na raiz para a lista completa do que trocar.
 */

export const LOJA = {
  nome: "Ateliê Arte Sacra",
  descricao:
    "Peças de arte sacra impressas em 3D e acabadas à mão. Luminárias, bustos e devocionais feitos sob encomenda.",

  // TROCAR: número com DDI+DDD, só dígitos. Ex: 5511987654321
  whatsapp: "5500000000000",
  // TROCAR
  instagram: "atelie.artesacra",
  // TROCAR
  email: "contato@atelieartesacra.com.br",
  // TROCAR: cidade/UF de onde saem os envios
  cidade: "Sua Cidade - UF",

  // TROCAR: domínio final. Usado nas tags de compartilhamento e no sitemap.
  url: "https://www.atelieartesacra.com.br",

  /** Frete grátis a partir deste valor, em centavos. */
  freteGratisAcima: 30000,
  /** Frete fixo cobrado abaixo do limite acima, em centavos. REVISAR. */
  freteFixo: 2500,
} as const;

export const linkWhatsApp = (mensagem: string) =>
  `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(mensagem)}`;
