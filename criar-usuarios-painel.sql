-- ════════════════════════════════════════════════════════════════════════════
--  CRIAR OS ACESSOS DO PAINEL  —  Priscilla e Romulo
-- ════════════════════════════════════════════════════════════════════════════
--
--  COMO USAR
--  1. Abra o SQL Editor do Supabase:
--     https://supabase.com/dashboard/project/ynrlolxcgjhtzllolxrk/sql/new
--  2. Cole este arquivo inteiro.
--  3. Troque os dois  000000  pelos PINs de verdade.
--  4. Clique em RUN.
--
--  Depois é só entrar em https://atelieartesacra.com.br/painel
--
--  SOBRE O PIN
--  • exatamente 6 dígitos, só números (ex.: 472913)
--  • evite 123456, 000000, 111111 e datas de nascimento — são os primeiros
--    que qualquer tentativa de invasão testa
--  • cada pessoa com o seu PIN: é assim que o histórico sabe quem alterou
--    cada preço
--
--  O PIN é guardado embaralhado (hash). Ninguém com acesso ao banco consegue
--  ler de volta — nem eu. Se esquecerem, é só rodar o comando de novo com um
--  PIN novo.
--
--  O login é sempre em minúsculo: digita-se "priscilla" e "romulo".
-- ════════════════════════════════════════════════════════════════════════════


select public.definir_usuario_painel(
  'priscilla',   -- login (digitar assim, em minúsculo)
  'Priscilla',   -- nome que aparece no painel: "Olá, Priscilla"
  '000000'       -- ⚠️ TROQUE pelo PIN de 6 dígitos dela
);

select public.definir_usuario_painel(
  'romulo',
  'Romulo',
  '000000'       -- ⚠️ TROQUE pelo PIN de 6 dígitos dele
);


-- ── Conferência: mostra quem ficou cadastrado (sem revelar nenhum PIN) ──────
select usuario as login, nome, ativo, criado_em
from public.usuarios_painel
order by criado_em;


-- ════════════════════════════════════════════════════════════════════════════
--  DEPOIS, QUANDO PRECISAR
-- ════════════════════════════════════════════════════════════════════════════
--
--  Trocar o PIN — é só rodar de novo com o mesmo login:
--    select public.definir_usuario_painel('priscilla', 'Priscilla', '654321');
--
--  Adicionar outra pessoa:
--    select public.definir_usuario_painel('fulano', 'Fulano', '472913');
--
--  Tirar o acesso (mantém o histórico do que a pessoa fez):
--    update public.usuarios_painel set ativo = false where usuario = 'fulano';
--
--  Devolver o acesso:
--    update public.usuarios_painel set ativo = true where usuario = 'fulano';
--
--  Destravar quem errou o PIN várias vezes e não quer esperar:
--    update public.usuarios_painel
--      set tentativas_erradas = 0, bloqueado_ate = null
--      where usuario = 'priscilla';
--
--  Ver o histórico de alterações (quem mudou o quê e quando):
--    select criado_em, usuario_nome, acao, alvo, detalhes
--    from public.log_painel order by criado_em desc limit 50;
-- ════════════════════════════════════════════════════════════════════════════
