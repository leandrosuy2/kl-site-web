import api from "@/lib/api";
import type { BoletoMulta } from "@/types/multaBoleto";

/**
 * Boletos de multas do cliente autenticado.
 * Endpoint esperado no backend: GET /cliente/multas/boletos
 */
export const multaBoletoService = {
  listar: async (): Promise<BoletoMulta[]> => {
    const response = await api.get<BoletoMulta[]>("/cliente/multas/boletos");
    return response.data;
  },
};
