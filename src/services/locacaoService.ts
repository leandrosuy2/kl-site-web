import api from "@/lib/api";
import type { Locacao } from "@/types/locacao";
import { normalizarLocacaoApi } from "@/lib/normalizarLocacao";

export type { Locacao } from "@/types/locacao";
export { derivarStatusLocacao, locacaoEstaConcluida } from "@/lib/locacaoStatus";

const locacaoService = {
  async listarLocacoes(): Promise<Locacao[]> {
    const response = await api.get<Record<string, unknown>[]>("/locacao");
    return response.data.map((row) => normalizarLocacaoApi(row));
  },
};

export default locacaoService;
