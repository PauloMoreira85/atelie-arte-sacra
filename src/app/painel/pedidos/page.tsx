import Link from "next/link";
import { exigirLogin } from "@/lib/painel-auth";
import { db } from "@/lib/supabase";
import { formatarPreco } from "@/data/produtos";
import { emitirNota, atualizarNota } from "./actions";
import { BotoesNota } from "./BotoesNota";

/**
 * Pedidos da loja, com a emissão da nota fiscal.
 *
 * Sempre atual: um pedido pago há dois minutos precisa aparecer agora.
 */
export const dynamic = "force-dynamic";

type Item = {
  produto_nome: string;
  acabamento: string | null;
  quantidade: number;
  preco_centavos: number;
};

type Pedido = {
  referencia: string;
  status: string;
  total_centavos: number;
  frete_centavos: number;
  cliente_nome: string;
  cliente_cpf_cnpj: string;
  entrega_cidade: string | null;
  entrega_uf: string | null;
  entrega_cep: string | null;
  frete_servico: string | null;
  nfe_status: string;
  nfe_numero: string | null;
  nfe_danfe_url: string | null;
  nfe_erro: string | null;
  base_pedido_id: string | null;
  criado_em: string;
  pago_em: string | null;
  pedido_itens: Item[];
};

const CORES: Record<string, string> = {
  pago: "border-ouro/40 text-ouro-claro",
  aberto: "border-creme-fraco/30 text-creme-fraco",
  cancelado: "border-red-500/30 text-red-300",
  expirado: "border-red-500/30 text-red-300",
};

function Etiqueta({ texto, cor }: { texto: string; cor: string }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs ${cor}`}>{texto}</span>
  );
}

const data = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default async function PedidosPage() {
  const usuario = await exigirLogin();

  const { data: linhas, error } = await db()
    .from("pedidos")
    .select("*, pedido_itens(*)")
    .order("criado_em", { ascending: false })
    .limit(100);

  const pedidos = (linhas ?? []) as unknown as Pedido[];
  const aFaturar = pedidos.filter(
    (p) => p.status === "pago" && p.nfe_status !== "emitida",
  ).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-creme">Pedidos</h1>
        <p className="mt-1 text-sm text-creme-fraco">
          Olá, {usuario.nome}.{" "}
          <Link href="/painel" className="underline underline-offset-4 hover:text-ouro-claro">
            voltar às peças
          </Link>
        </p>
        {aFaturar > 0 && (
          <p className="mt-3 text-sm text-ouro-claro">
            {aFaturar} {aFaturar === 1 ? "pedido pago aguarda" : "pedidos pagos aguardam"} nota
            fiscal.
          </p>
        )}
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          Não consegui ler os pedidos: {error.message}
        </p>
      )}

      {!error && pedidos.length === 0 && (
        <p className="rounded-lg border border-ouro/15 p-6 text-sm text-creme-fraco">
          Nenhum pedido ainda. Eles aparecem aqui assim que alguém abre o pagamento.
        </p>
      )}

      <ul className="space-y-4">
        {pedidos.map((p) => (
          <li key={p.referencia} className="rounded-xl border border-ouro/15 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-creme-fraco">{p.referencia}</p>
                <p className="mt-1 text-creme">{p.cliente_nome}</p>
                <p className="text-xs text-creme-fraco">
                  {p.entrega_cidade ? `${p.entrega_cidade}/${p.entrega_uf}` : "endereço pendente"}
                  {p.frete_servico && ` · ${p.frete_servico}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg text-creme">{formatarPreco(p.total_centavos)}</p>
                <p className="text-xs text-creme-fraco">
                  {p.frete_centavos > 0
                    ? `frete ${formatarPreco(p.frete_centavos)}`
                    : "frete grátis"}
                </p>
              </div>
            </div>

            <ul className="mt-3 space-y-0.5 text-sm text-creme-suave">
              {p.pedido_itens?.map((i, n) => (
                <li key={n}>
                  {i.quantidade}× {i.produto_nome}
                  {i.acabamento && (
                    <span className="text-creme-fraco"> · {i.acabamento}</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ouro/10 pt-3">
              <Etiqueta texto={p.status} cor={CORES[p.status] ?? CORES.aberto} />

              {p.nfe_status === "emitida" ? (
                <Etiqueta
                  texto={p.nfe_numero ? `NF-e ${p.nfe_numero}` : "NF-e emitida"}
                  cor="border-ouro/40 text-ouro-claro"
                />
              ) : p.nfe_status === "erro" ? (
                <Etiqueta texto="NF-e com erro" cor="border-red-500/30 text-red-300" />
              ) : p.status === "pago" ? (
                <Etiqueta texto="sem nota" cor="border-creme-fraco/30 text-creme-fraco" />
              ) : null}

              {p.nfe_danfe_url && (
                <a
                  href={p.nfe_danfe_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ouro-claro underline underline-offset-4"
                >
                  DANFE
                </a>
              )}

              <span className="ml-auto text-xs text-creme-fraco">
                {p.pago_em ? `pago ${data(p.pago_em)}` : `aberto ${data(p.criado_em)}`}
              </span>
            </div>

            {p.nfe_erro && (
              <p className="mt-2 rounded border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-300">
                {p.nfe_erro}
              </p>
            )}

            {/* Só pedido pago e ainda sem nota pode ser faturado. */}
            {p.status === "pago" && p.nfe_status !== "emitida" && (
              <div className="mt-3">
                <BotoesNota
                  referencia={p.referencia}
                  jaEnviado={Boolean(p.base_pedido_id)}
                  emitir={emitirNota}
                  atualizar={atualizarNota}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
