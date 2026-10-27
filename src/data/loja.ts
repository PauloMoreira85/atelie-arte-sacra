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
  //
  // É o número da Priscilla, no ES — intencional: ela faz o atendimento,
  // mesmo com a expedição saindo de Maringá. Não trocar por engano achando
  // que o DDD está errado.
  whatsapp: "5527992314183",
  // Sem o "@" — ele é adicionado na exibição e o link usa o valor puro.
  instagram: "atelie.arte.sacra",
  // TROCAR
  email: "contato@atelieartesacra.com.br",
  // Cidade de onde saem os envios — é o que o cliente vê. As peças são
  // produzidas em Colatina-ES, mas a expedição e a nota saem de Maringá.
  cidade: "Enviamos de Maringá - PR",

  // Domínio de produção. Usado nas tags de compartilhamento e no sitemap.
  // Sem "www": o www redireciona para cá, então usar a forma canônica evita
  // que o Google indexe URLs que só redirecionam.
  url: "https://atelieartesacra.com.br",

  /** Frete grátis a partir deste valor, em centavos. */
  freteGratisAcima: 40000,

  /**
   * Máximo de parcelas sem juros no cartão.
   *
   * Fica aqui porque o número aparece no texto que o cliente lê E no limite
   * que vai para a Asaas. Estavam escritos separados e podiam discordar —
   * prometer 6x na página e a Asaas só aceitar 3x é briga na hora de pagar.
   */
  parcelasMax: 3,
} as const;

export const linkWhatsApp = (mensagem: string) =>
  `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(mensagem)}`;
