-- ════════════════════════════════════════════════════════════════════════════
--  ORIGEM DOS PEDIDOS  —  de qual anúncio/campanha veio cada venda
-- ════════════════════════════════════════════════════════════════════════════
--
--  Os pedidos ficam na Asaas, não no nosso banco. Esta tabela guarda só a
--  ORIGEM de cada checkout aberto (UTMs e IDs de clique do Google/Meta),
--  ligada ao pedido pela referência AAS-... — a mesma "Referência externa"
--  que aparece no extrato da Asaas.
--
--  Enquanto esta tabela não existir, o site funciona normalmente: a origem
--  só vai para o log da Vercel. Depois de criar, passa a ser gravada aqui.
--
--  COMO USAR
--  1. Abra o SQL Editor do Supabase:
--     https://supabase.com/dashboard/project/ynrlolxcgjhtzllolxrk/sql/new
--  2. Cole este arquivo inteiro e clique em RUN.
--
--  Observação: a linha é gravada quando o cliente ABRE o pagamento. Para
--  saber se pagou, cruze a referência com o extrato da Asaas.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.pedidos_origem (
  referencia            text primary key,
  valor_centavos        integer not null,
  utm_source            text,
  utm_medium            text,
  utm_campaign          text,
  utm_term              text,
  utm_content           text,
  gclid                 text,
  gbraid                text,
  wbraid                text,
  fbclid                text,
  pagina_entrada        text,
  origem_capturada_em   timestamptz,
  criado_em             timestamptz not null default now()
);

-- Só o servidor (service role) escreve e lê. Sem políticas, a chave pública
-- do browser não enxerga nada.
alter table public.pedidos_origem enable row level security;

create index if not exists pedidos_origem_campanha_idx
  on public.pedidos_origem (utm_campaign, criado_em desc);
