/** Registro de locação do cliente (contrato alinhado à API + campos opcionais). */
export interface Locacao {
  id_loc: number;
  dataLoc: string;
  dataPrev: string;
  dataDevolucao: string | null;
  clienteId: number;
  id_car: number | null;
  placa_car: string;
  modelo_car: string;
  descricao_ctg: string;
  nome_marca: string;
  /** Status vindo do backend, quando existir */
  status?: string;
  valor_total?: string | number | null;
  km_inicial?: number | null;
  km_final?: number | null;
  loja_retirada?: string;
  loja_devolucao?: string;
  observacoes?: string;
  id_reserva?: number | null;
  grupo_nome?: string;
}

/** Status calculado no painel para clareza quando a API não envia flag explícita */
export type StatusLocacaoPainel = "em_andamento" | "concluida" | "atrasada";
