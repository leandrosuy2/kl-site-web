import type { Locacao } from "@/types/locacao";

function str(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return "";
}

function num(row: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function numNullable(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Aceita objetos da API com camelCase ou snake_case parcial. */
export function normalizarLocacaoApi(row: Record<string, unknown>): Locacao {
  const rawDev =
    row.dataDevolucao ??
    row.data_devolucao ??
    row.dataDev ??
    row.dt_devolucao;
  let dataDevolucao: string | null = null;
  if (rawDev != null && String(rawDev).trim() !== "") {
    const s = String(rawDev).trim();
    if (!/^0000-00-00/.test(s) && s !== "null") {
      dataDevolucao = s;
    }
  }

  const idCarRaw = row.id_car ?? row.idCar ?? row.id_veiculo;
  const idParsed = idCarRaw != null && idCarRaw !== "" ? Number(idCarRaw) : NaN;
  const id_car = Number.isFinite(idParsed) ? idParsed : null;

  return {
    id_loc: num(row, "id_loc", "idLoc"),
    dataLoc: str(row, "dataLoc", "data_loc"),
    dataPrev: str(row, "dataPrev", "data_prev"),
    dataDevolucao,
    clienteId: num(row, "clienteId", "cliente_id"),
    id_car,
    placa_car: str(row, "placa_car", "placa"),
    modelo_car: str(row, "modelo_car", "modelo"),
    descricao_ctg: str(row, "descricao_ctg", "descricaoCtg"),
    nome_marca: str(row, "nome_marca", "marca"),
    status: row.status != null ? String(row.status) : undefined,
    valor_total: row.valor_total ?? row.valorTotal ?? row.vlr_total ?? null,
    km_inicial: numNullable(row, "km_inicial", "kmInicial"),
    km_final: numNullable(row, "km_final", "kmFinal"),
    loja_retirada:
      row.loja_retirada != null
        ? String(row.loja_retirada)
        : row.lojaRetirada != null
          ? String(row.lojaRetirada)
          : undefined,
    loja_devolucao:
      row.loja_devolucao != null
        ? String(row.loja_devolucao)
        : row.lojaDevolucao != null
          ? String(row.lojaDevolucao)
          : undefined,
    observacoes:
      row.observacoes != null
        ? String(row.observacoes)
        : row.obs != undefined
          ? String(row.obs)
          : undefined,
    id_reserva: numNullable(row, "id_reserva", "idReserva"),
    grupo_nome:
      row.grupo_nome != null
        ? String(row.grupo_nome)
        : row.grupoNome != null
          ? String(row.grupoNome)
          : undefined,
  };
}
