import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import locacaoService from "@/services/locacaoService";
import type { Locacao, StatusLocacaoPainel } from "@/types/locacao";
import { derivarStatusLocacao, locacaoEstaConcluida } from "@/lib/locacaoStatus";
import docVeiculoService from "@/services/docVeiculoService";
import {
  FileText,
  Car,
  Calendar,
  Hash,
  ExternalLink,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatarDataHora = (s: string) => {
  if (!s?.trim()) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("pt-BR");
};

function badgeLocacao(st: StatusLocacaoPainel) {
  const cfg: Record<
    StatusLocacaoPainel,
    { label: string; className: string; Icon: typeof Activity }
  > = {
    em_andamento: {
      label: "Em andamento",
      className: "bg-blue-600 text-white",
      Icon: Activity,
    },
    concluida: {
      label: "Encerrada",
      className: "bg-emerald-700 text-white",
      Icon: CheckCircle,
    },
    atrasada: {
      label: "Atrasada (vs. previsão)",
      className: "bg-amber-600 text-white",
      Icon: AlertCircle,
    },
  };
  const c = cfg[st];
  const I = c.Icon;
  return (
    <Badge className={cn("gap-1 font-semibold border-0", c.className)}>
      <I className="h-3.5 w-3.5" />
      {c.label}
    </Badge>
  );
}

const ListaDocVeiculos = () => {
  const { toast } = useToast();
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocCarId, setLoadingDocCarId] = useState<number | null>(null);

  const carregar = useCallback(() => {
    setLoading(true);
    locacaoService
      .listarLocacoes()
      .then(setLocacoes)
      .catch(() => {
        setLocacoes([]);
        toast({
          variant: "destructive",
          title: "Não foi possível carregar",
          description: "Tente novamente em instantes.",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirDocumentacao = async (loc: Locacao) => {
    if (loc.id_car == null) {
      toast({
        variant: "destructive",
        title: "Veículo sem identificação",
        description: "Não há link de documentação disponível para este registro.",
      });
      return;
    }
    setLoadingDocCarId(loc.id_car);
    try {
      const url = await docVeiculoService.getDocLink(loc.id_car);
      if (url?.trim()) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast({
          variant: "destructive",
          title: "Link indisponível",
          description: "A locadora ainda não liberou a documentação deste veículo.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao abrir documentação",
        description: "Não foi possível obter o link. Tente mais tarde.",
      });
    } finally {
      setLoadingDocCarId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Documentação de veículos</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Veículos das suas locações ativas ou recentes. Abra a documentação do carro quando o link
            estiver disponível.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={carregar}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar lista
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-gray-600 text-sm">Carregando veículos...</p>
        </div>
      ) : locacoes.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center text-gray-500 space-y-4">
            <FileText className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum veículo com documentação</h3>
              <p className="max-w-md mx-auto text-sm sm:text-base">
                Quando houver locação em seu nome, o veículo aparece aqui para você acessar os
                documentos.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {locacoes.map((loc) => {
            const status = derivarStatusLocacao(loc);
            return (
              <Card
                key={loc.id_loc}
                className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg sm:text-xl leading-tight">
                          {loc.modelo_car}
                          <span className="text-gray-500 font-normal"> · {loc.placa_car}</span>
                        </CardTitle>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {badgeLocacao(status)}
                        <Badge
                          variant="outline"
                          className="text-emerald-800 border-emerald-200 bg-emerald-50"
                        >
                          {loc.nome_marca}
                        </Badge>
                      </div>
                      {loc.descricao_ctg?.trim() && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Categoria:</span>{" "}
                          {loc.descricao_ctg.trim()}
                        </p>
                      )}
                      <CardDescription className="text-xs sm:text-sm text-gray-600 pt-1">
                        Documentação ligada ao veículo desta locação (contrato #{loc.id_loc}).
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 justify-end">
                        <Hash className="h-4 w-4 shrink-0" />
                        Contrato #{loc.id_loc}
                      </span>
                      {loc.id_car != null ? (
                        <Button
                          type="button"
                          className="gap-2 w-full sm:w-auto"
                          disabled={loadingDocCarId === loc.id_car}
                          onClick={() => abrirDocumentacao(loc)}
                        >
                          {loadingDocCarId === loc.id_car ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Abrindo...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Ver documentação
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-right">
                          Veículo sem código de documentação neste registro.
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Locação
                      </h4>
                      <Separator />
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">Início</dt>
                          <dd className="font-medium text-right">{formatarDataHora(loc.dataLoc)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">Previsão de devolução</dt>
                          <dd className="font-medium text-right">{formatarDataHora(loc.dataPrev)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">Devolução efetiva</dt>
                          <dd className="font-medium text-right">
                            {locacaoEstaConcluida(loc) && loc.dataDevolucao
                              ? formatarDataHora(loc.dataDevolucao)
                              : "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Veículo
                      </h4>
                      <Separator />
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">Modelo</dt>
                          <dd className="font-medium text-right">{loc.modelo_car}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">Placa</dt>
                          <dd className="font-medium text-right">{loc.placa_car}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">ID veículo</dt>
                          <dd className="font-medium text-right font-mono text-xs sm:text-sm">
                            {loc.id_car ?? "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListaDocVeiculos;
