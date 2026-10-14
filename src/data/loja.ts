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

  // DDI 55 + DDD 27 + número. Só dígitos, como o wa.me exige.
  whatsapp: "5527992314183",
  // Sem o "@" — ele é adicionado na exibição e o link usa o valor puro.
  instagram: "atelie.arte.sacra",
  // TROCAR
  email: "contato@atelieartesacra.com.br",
  // Cidade de onde saem os envios.
  cidade: "Colatina - Espírito Santo",

  // Domínio de produção. Usado nas tags de compartilhamento e no sitemap.
  // Sem "www": o www redireciona para cá, então usar a forma canônica evita
  // que o Google indexe URLs que só redirecionam.
  url: "https://atelieartesacra.com.br",

  /** Frete grátis a partir deste valor, em centavos. */
  freteGratisAcima: 30000,
  /** Frete fixo cobrado abaixo do limite acima, em centavos. REVISAR. */
  freteFixo: 2500,
} as const;

export const linkWhatsApp = (mensagem: string) =>
  `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(mensagem)}`;
