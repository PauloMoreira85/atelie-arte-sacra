import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/supabase";

/**
 * Login do painel: usuário + PIN de 6 dígitos.
 *
 * O PIN é conferido por uma função no banco (conferir_pin), que compara o
 * hash bcrypt e aplica a trava progressiva contra força bruta. O PIN em si
 * nunca é guardado nem registrado em log.
 *
 * A sessão é um cookie httpOnly com um token aleatório de 32 bytes. No banco
 * guardamos só o HASH do token — se o banco vazar, as sessões não podem ser
 * reutilizadas.
 */

const COOKIE = "painel_sessao";
const DIAS_DE_SESSAO = 7;

const hash = (v: string) => createHash("sha256").update(v).digest("hex");

export type UsuarioPainel = { id: string; nome: string };

export type ResultadoLogin =
  | { ok: true }
  | { ok: false; erro: string };

export async function entrar(
  usuario: string,
  pin: string,
): Promise<ResultadoLogin> {
  const login = usuario.trim().toLowerCase();

  if (!login) return { ok: false, erro: "Informe o usuário." };
  if (!/^\d{6}$/.test(pin)) {
    return { ok: false, erro: "O PIN tem 6 dígitos." };
  }

  const { data, error } = await db().rpc("conferir_pin", {
    p_usuario: login,
    p_pin: pin,
  });

  if (error) {
    console.error("[painel] erro ao conferir PIN:", error.message);
    return { ok: false, erro: "Não foi possível entrar agora. Tente de novo." };
  }

  const r = Array.isArray(data) ? data[0] : data;

  if (!r?.ok) {
    if (r?.motivo === "bloqueado") {
      const s = Number(r.espera_segundos) || 60;
      const minutos = Math.ceil(s / 60);
      return {
        ok: false,
        erro: `Muitas tentativas. Aguarde ${minutos} minuto${minutos > 1 ? "s" : ""} e tente de novo.`,
      };
    }
    // Mensagem igual para usuário inexistente e PIN errado: não entregamos
    // a quem tenta adivinhar qual dos dois está errado.
    return { ok: false, erro: "Usuário ou PIN incorreto." };
  }

  const token = randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + DIAS_DE_SESSAO * 86400_000);

  const { error: erroSessao } = await db().from("sessoes_painel").insert({
    usuario_id: r.usuario_id,
    token_hash: hash(token),
    expira_em: expira.toISOString(),
  });

  if (erroSessao) {
    console.error("[painel] erro ao criar sessão:", erroSessao.message);
    return { ok: false, erro: "Não foi possível entrar agora. Tente de novo." };
  }

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expira,
  });

  await registrar(r.usuario_id, r.nome, "entrou");
  return { ok: true };
}

export async function sair() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db().from("sessoes_painel").delete().eq("token_hash", hash(token));
  }
  jar.delete(COOKIE);
}

/** Devolve o usuário logado, ou null. */
export async function usuarioAtual(): Promise<UsuarioPainel | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const { data } = await db()
    .from("sessoes_painel")
    .select("expira_em, usuarios_painel(id, nome, ativo)")
    .eq("token_hash", hash(token))
    .maybeSingle();

  if (!data) return null;

  const u = data.usuarios_painel as unknown as {
    id: string;
    nome: string;
    ativo: boolean;
  } | null;

  if (!u?.ativo) return null;
  if (new Date(data.expira_em) < new Date()) return null;

  return { id: u.id, nome: u.nome };
}

/** Usado nas páginas do painel: manda para o login se não estiver logado. */
export async function exigirLogin(): Promise<UsuarioPainel> {
  const u = await usuarioAtual();
  if (!u) redirect("/painel/entrar");
  return u;
}

/** Registra uma ação no log — com 2-3 pessoas, saber quem mudou o quê importa. */
export async function registrar(
  usuarioId: string | null,
  usuarioNome: string | null,
  acao: string,
  alvo?: string,
  detalhes?: unknown,
) {
  try {
    await db().from("log_painel").insert({
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      acao,
      alvo: alvo ?? null,
      detalhes: detalhes ?? null,
    });
  } catch {
    // Log é acessório: nunca deve derrubar a ação principal.
  }
}
