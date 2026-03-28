import type { Locacao, StatusLocacaoPainel } from "@/types/locacao";

function dataDevolucaoEfetiva(loc: Locacao): boolean {
  const d = loc.dataDevolucao;
  if (d == null) return false;
  const s = String(d).trim();
  if (s === "" || s === "null" || /^0000-00-00/.test(s)) return false;
  const t = new Date(s).getTime();
  return !Number.isNaN(t);
}

/** Locação encerrada (devolução registrada). */
export function locacaoEstaConcluida(loc: Locacao): boolean {
  return dataDevolucaoEfetiva(loc);
}

/**
 * Retorno previsto já passou e a locação ainda não foi encerrada.
 * Útil para alertar o cliente a regularizar ou confirmar com a locadora.
 */
export function locacaoEstaAtrasadaVsPrevisao(loc: Locacao): boolean {
  if (locacaoEstaConcluida(loc)) return false;
  const prev = new Date(loc.dataPrev);
  if (Number.isNaN(prev.getTime())) return false;
  return prev.getTime() < Date.now();
}

/** Status consolidado para exibição no painel. */
export function derivarStatusLocacao(loc: Locacao): StatusLocacaoPainel {
  if (locacaoEstaConcluida(loc)) return "concluida";
  if (locacaoEstaAtrasadaVsPrevisao(loc)) return "atrasada";
  return "em_andamento";
}
