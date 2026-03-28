/** Boletos de multas de trânsito vinculados ao cliente (contrato com a API). */
export type StatusBoletoMulta = "aberto" | "pago" | "vencido" | "cancelado";

export interface BoletoMulta {
  id: number;
  descricao: string;
  autoInfracao?: string;
  placa?: string;
  valor: string;
  dataVencimento: string;
  dataEmissao?: string;
  status: StatusBoletoMulta;
  linhaDigitavel?: string | null;
  urlPdf?: string | null;
  urlPagamento?: string | null;
}
