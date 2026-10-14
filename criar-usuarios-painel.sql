-- ════════════════════════════════════════════════════════════════════════════
--  CRIAR OS ACESSOS DO PAINEL
-- ════════════════════════════════════════════════════════════════════════════
--
--  COMO USAR
--  1. Abra o SQL Editor do Supabase:
--     https://supabase.com/dashboard/project/ynrlolxcgjhtzllolxrk/sql/new
--  2. Cole este arquivo inteiro.
--  3. Troque os  usuario , o  Nome  e o  PIN  de cada linha.
--  4. Clique em RUN.
--
--  O PIN é guardado embaralhado (hash). Nem eu nem ninguém com acesso ao
--  banco consegue ler de volta — só conferir se está certo no login.
--
--  REGRAS DO PIN
--  • exatamente 6 dígitos (0-9), sem letras
--  • evite 123456, 000000 e datas de nascimento
--  • cada pessoa com o seu: é assim que o log sabe quem alterou o quê
--
--  O nome de usuário é o que se digita para entrar. Use algo curto, sem
--  espaço e sem acento (ex.: paulo, ana, atelie).
-- ════════════════════════════════════════════════════════════════════════════


-- ── Pessoa 1 ────────────────────────────────────────────────────────────────
select public.definir_usuario_painel(
  'usuario1',          -- ← nome de usuário para entrar (minúsculo, sem acento)
  'Nome Completo',     -- ← nome que aparece no painel: "Olá, Fulano"
  '000000'             -- ← PIN de 6 dígitos  ⚠️ TROQUE
);

-- ── Pessoa 2 ────────────────────────────────────────────────────────────────
select public.definir_usuario_painel(
  'usuario2',
  'Nome Completo',
  '000000'             -- ⚠️ TROQUE
);

-- ── Pessoa 3 (apague este bloco se forem só duas) ───────────────────────────
select public.definir_usuario_painel(
  'usuario3',
  'Nome Completo',
  '000000'             -- ⚠️ TROQUE
);


-- ── Conferência: mostra quem ficou cadastrado (sem revelar nenhum PIN) ──────
select usuario, nome, ativo, criado_em
from public.usuarios_painel
order by criado_em;


-- ════════════════════════════════════════════════════════════════════════════
--  DEPOIS, QUANDO PRECISAR
-- ════════════════════════════════════════════════════════════════════════════
--
--  Trocar o PIN de alguém — é só rodar de novo com o mesmo usuário:
--    select public.definir_usuario_painel('paulo', 'Paulo', '654321');
--
--  Tirar o acesso de alguém (mantém o histórico do que a pessoa fez):
--    update public.usuarios_painel set ativo = false where usuario = 'fulano';
--
--  Devolver o acesso:
--    update public.usuarios_painel set ativo = true where usuario = 'fulano';
--
--  Destravar alguém que errou o PIN várias vezes e não quer esperar:
--    update public.usuarios_painel
--      set tentativas_erradas = 0, bloqueado_ate = null
--      where usuario = 'fulano';
--
--  Ver o histórico de alterações (quem mudou o quê e quando):
--    select criado_em, usuario_nome, acao, alvo, detalhes
--    from public.log_painel order by criado_em desc limit 50;
-- ════════════════════════════════════════════════════════════════════════════
