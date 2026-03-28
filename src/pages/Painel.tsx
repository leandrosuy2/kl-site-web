import locacaoService, {
  derivarStatusLocacao,
  locacaoEstaConcluida,
  type Locacao,
} from "@/services/locacaoService";
import type { StatusLocacaoPainel } from "@/types/locacao";
import ListaDocVeiculos from "./ListaDocVeiculos";
import ConfiguracoesPainel from "@/components/painel/ConfiguracoesPainel";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authService } from "@/services/authService";
import { reservaService } from "@/services/reservaService";
import { multaBoletoService } from "@/services/multaBoletoService";
import type { BoletoMulta, StatusBoletoMulta } from "@/types/multaBoleto";
import { CancelReservationModal } from "@/components/landing/CancelReservationModal";
import { useToast } from "@/hooks/use-toast";
import { ReservaResponse } from "@/types/reserva";
import { 
  LayoutDashboard, 
  Car, 
  FileText, 
  Settings, 
  LogOut, 
  Menu,
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  Activity,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Receipt,
  RefreshCw,
  Gauge,
  Hash,
  PlusCircle,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAINEL_SECTIONS = [
  "dashboard",
  "locacao",
  "reservas",
  "manutencao",
  "veiculos",
  "boletos",
  "configuracoes",
] as const;

type PainelSection = (typeof PAINEL_SECTIONS)[number];

const Painel = () => {
  const { section: sectionParam } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const section = (sectionParam && PAINEL_SECTIONS.includes(sectionParam as PainelSection)
    ? sectionParam
    : "dashboard") as PainelSection;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [loadingLocacoes, setLoadingLocacoes] = useState(false);
  const [erroLocacoes, setErroLocacoes] = useState<string | null>(null);
  const [user, setUser] = useState(authService.getUser());
  const [reservas, setReservas] = useState<ReservaResponse[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reservaIdParaCancelar, setReservaIdParaCancelar] = useState<number | null>(null);
  const [boletosMultas, setBoletosMultas] = useState<BoletoMulta[]>([]);
  const [loadingBoletos, setLoadingBoletos] = useState(false);
  const [erroBoletos, setErroBoletos] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (sectionParam && !PAINEL_SECTIONS.includes(sectionParam as PainelSection)) {
      navigate("/painel/dashboard", { replace: true });
    }
  }, [sectionParam, navigate]);

  const fetchLocacoes = useCallback(() => {
    setLoadingLocacoes(true);
    setErroLocacoes(null);
    locacaoService
      .listarLocacoes()
      .then(setLocacoes)
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setLocacoes([]);
        setErroLocacoes(
          err.response?.data?.message ??
            "Não foi possível carregar suas locações. Verifique sua conexão e tente novamente."
        );
      })
      .finally(() => setLoadingLocacoes(false));
  }, []);

  useEffect(() => {
    if (section === "locacao") {
      fetchLocacoes();
    }
  }, [section, fetchLocacoes]);
  // Abrir modal de cancelamento
  const abrirModalCancelar = (idReserva: number) => {
    setReservaIdParaCancelar(idReserva);
    setCancelModalOpen(true);
  };

  // Cancelar reserva
  const handleCancelarReserva = async (motivo: string) => {
    if (!reservaIdParaCancelar) return;
    setCancelLoading(true);
    try {
      await reservaService.cancelarReserva(reservaIdParaCancelar, motivo);
      toast({
        title: "Reserva cancelada",
        description: "A reserva foi cancelada com sucesso.",
      });
      setCancelModalOpen(false);
      setReservaIdParaCancelar(null);
      carregarReservas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar",
        description: error.response?.data?.message || "Não foi possível cancelar a reserva.",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    // Verificar se está autenticado
    if (!authService.isAuthenticated()) {
      window.location.href = "/";
      return;
    }

    // Garantir que o user está atualizado
    const currentUser = authService.getUser();
    if (currentUser) {
      setUser(currentUser);
    }

    // Listener para mudanças no localStorage
    const handleStorageChange = () => {
      const updatedUser = authService.getUser();
      setUser(updatedUser);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/";
  };

  const carregarReservas = async () => {
    try {
      setLoadingReservas(true);
      // Buscar todas as reservas (admin ou painel)
      const data = await reservaService.minhasReservas();
      setReservas(data);
    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
    } finally {
      setLoadingReservas(false);
    }
  };

  useEffect(() => {
    if (section === "reservas") {
      carregarReservas();
    }
  }, [section]);

  useEffect(() => {
    if (section !== "boletos") return;
    setLoadingBoletos(true);
    setErroBoletos(null);
    multaBoletoService
      .listar()
      .then(setBoletosMultas)
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setBoletosMultas([]);
        setErroBoletos(
          err.response?.data?.message || "Não foi possível carregar os boletos de multas."
        );
      })
      .finally(() => setLoadingBoletos(false));
  }, [section]);

  const getStatusBadge = (status: ReservaResponse["status"]) => {
    const statusConfig = {
      pendente: {
        label: "Pendente",
        icon: AlertCircle,
        className: "bg-yellow-500 text-white"
      },
      confirmada: {
        label: "Confirmada",
        icon: CheckCircle,
        className: "bg-green-500 text-white"
      },
      cancelada: {
        label: "Cancelada",
        icon: XCircle,
        className: "bg-red-500 text-white"
      },
      concluida: {
        label: "Concluída",
        icon: CheckCircle,
        className: "bg-blue-500 text-white"
      }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatarData = (data: string) => {
    const date = new Date(data);
    return date.toLocaleDateString("pt-BR");
  };

  const formatarDataHora = (data: string) => {
    const date = new Date(data);
    return date.toLocaleString("pt-BR");
  };

  const getBoletoMultaStatusBadge = (status: StatusBoletoMulta) => {
    const map: Record<
      StatusBoletoMulta,
      { label: string; className: string }
    > = {
      aberto: { label: "Em aberto", className: "bg-amber-500 text-white" },
      pago: { label: "Pago", className: "bg-emerald-600 text-white" },
      vencido: { label: "Vencido", className: "bg-red-600 text-white" },
      cancelado: { label: "Cancelado", className: "bg-gray-500 text-white" },
    };
    const c = map[status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.className}`}
      >
        {c.label}
      </span>
    );
  };

  const copiarLinhaDigitavel = async (linha: string) => {
    try {
      await navigator.clipboard.writeText(linha.replace(/\D/g, ""));
      toast({ title: "Linha digitável copiada" });
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível copiar",
        description: "Copie manualmente ou use o PDF do boleto.",
      });
    }
  };

  const menuItems: { path: PainelSection; label: string; icon: typeof LayoutDashboard }[] = [
    { path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "locacao", label: "Locação", icon: Car },
    { path: "reservas", label: "Reservas", icon: Calendar },
    { path: "manutencao", label: "Manutenção", icon: Activity },
    { path: "veiculos", label: "Doc Veículos", icon: FileText },
    { path: "boletos", label: "Boletos de multas", icon: Receipt },
    { path: "configuracoes", label: "Minha conta", icon: Settings },
  ];

  const tituloCabecalho =
    menuItems.find((m) => m.path === section)?.label ?? "Painel";

  const stats = [
    { 
      title: "Reservas Ativas", 
      value: "28", 
      change: "+12%", 
      icon: Calendar,
      color: "text-blue-600 bg-blue-100"
    },
    { 
      title: "Veículos Disponíveis", 
      value: "42", 
      change: "+5%", 
      icon: Car,
      color: "text-green-600 bg-green-100"
    },
    { 
      title: "Receita Mensal", 
      value: "R$ 45.2k", 
      change: "+18%", 
      icon: DollarSign,
      color: "text-purple-600 bg-purple-100"
    },
    { 
      title: "Taxa de Ocupação", 
      value: "67%", 
      change: "+8%", 
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-100"
    },
  ];

  const recentActivity = [
    { action: "Nova reserva", client: "João Silva", vehicle: "Grupo B", time: "há 5 min" },
    { action: "Devolução", client: "Maria Santos", vehicle: "Grupo D", time: "há 15 min" },
    { action: "Reserva cancelada", client: "Pedro Costa", vehicle: "Grupo C", time: "há 1 hora" },
    { action: "Nova reserva", client: "Ana Paula", vehicle: "Grupo G/a", time: "há 2 horas" },
  ];

  const formatarDataHoraLoc = (s: string) => {
    if (!s?.trim()) return "—";
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? s : d.toLocaleString("pt-BR");
  };

  const formatarValorLocacao = (v: string | number | null | undefined) => {
    if (v == null || v === "") return null;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    if (Number.isNaN(n)) return null;
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const badgeStatusPainel = (st: StatusLocacaoPainel) => {
    const cfg: Record<
      StatusLocacaoPainel,
      { label: string; className: string; Icon: typeof Activity }
    > = {
      em_andamento: {
        label: "Em andamento",
        className: "bg-blue-600 text-white hover:bg-blue-600",
        Icon: Activity,
      },
      concluida: {
        label: "Concluída",
        className: "bg-emerald-700 text-white hover:bg-emerald-700",
        Icon: CheckCircle,
      },
      atrasada: {
        label: "Atrasada (vs. previsão)",
        className: "bg-amber-600 text-white hover:bg-amber-600",
        Icon: AlertCircle,
      },
    };
    const c = cfg[st];
    const I = c.Icon;
    return (
      <Badge className={`gap-1 font-semibold ${c.className}`}>
        <I className="h-3.5 w-3.5" />
        {c.label}
      </Badge>
    );
  };

  const locacoesAtivasCount = locacoes.filter((l) => !locacaoEstaConcluida(l)).length;
  const locacoesConcluidasCount = locacoes.length - locacoesAtivasCount;

  // Telas base para cada menu
  const ListaLocacao = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Locações</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Veículos em seu nome: períodos, devolução e status atualizados. O agendamento inicia em{" "}
            <NavLink to="/frota" className="text-emerald-700 font-medium hover:underline">
              Locação no site
            </NavLink>
            ; após a retirada, o contrato aparece aqui.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchLocacoes()}
            disabled={loadingLocacoes}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingLocacoes ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button type="button" size="sm" className="gap-2" asChild>
            <NavLink to="/painel/reservas">Reservas / agendamentos</NavLink>
          </Button>
        </div>
      </div>

      {!loadingLocacoes && locacoes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-blue-100 bg-blue-50/50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-blue-900 uppercase tracking-wide">Em aberto</p>
              <p className="text-2xl font-bold text-blue-950">{locacoesAtivasCount}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-emerald-900 uppercase tracking-wide">Concluídas</p>
              <p className="text-2xl font-bold text-emerald-950">{locacoesConcluidasCount}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50/80">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900">{locacoes.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {loadingLocacoes ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-gray-600">Carregando locações...</p>
        </div>
      ) : erroLocacoes ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
            <p className="font-medium text-red-900">{erroLocacoes}</p>
            <Button type="button" variant="secondary" onClick={() => fetchLocacoes()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : locacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 space-y-4">
            <Car className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma locação registrada</h3>
              <p className="max-w-md mx-auto">
                Quando você retirar um veículo, o contrato será listado aqui com datas e status. Faça um
                agendamento primeiro.
              </p>
            </div>
            <Button asChild>
              <NavLink to="/frota">Ir para locação e agendar</NavLink>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {locacoes.map((loc) => {
            const statusPainel = derivarStatusLocacao(loc);
            const valorFmt = formatarValorLocacao(loc.valor_total);
            return (
              <Card key={loc.id_loc} className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6 border-b">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg sm:text-xl leading-tight">
                          {loc.modelo_car}
                          <span className="text-gray-500 font-normal"> · {loc.placa_car}</span>
                        </CardTitle>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {badgeStatusPainel(statusPainel)}
                        <Badge variant="outline" className="text-emerald-800 border-emerald-200 bg-emerald-50">
                          {loc.nome_marca}
                        </Badge>
                        {loc.status && (
                          <Badge variant="secondary" className="font-normal text-xs">
                            API: {loc.status}
                          </Badge>
                        )}
                      </div>
                      {(loc.grupo_nome || loc.descricao_ctg) && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Grupo / categoria:</span>{" "}
                          {loc.grupo_nome || loc.descricao_ctg}
                        </p>
                      )}
                      {statusPainel === "atrasada" && (
                        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                          A data prevista de devolução já passou e não há devolução registrada no sistema.
                          Entre em contato com a locadora ou finalize a devolução do veículo.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-1 text-sm text-gray-600 lg:text-right lg:items-end shrink-0">
                      <span className="inline-flex items-center gap-1.5 text-gray-500">
                        <Hash className="h-4 w-4" />
                        Contrato #{loc.id_loc}
                      </span>
                      {loc.id_reserva != null && (
                        <span className="text-xs">Reserva associada #{loc.id_reserva}</span>
                      )}
                      {valorFmt && (
                        <span className="text-base font-semibold text-gray-900">{valorFmt}</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Cronograma
                      </h4>
                      <Separator />
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">Início da locação</dt>
                          <dd className="font-medium text-right">{formatarDataHoraLoc(loc.dataLoc)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">Previsão de devolução</dt>
                          <dd className="font-medium text-right">{formatarDataHoraLoc(loc.dataPrev)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">Devolução efetiva</dt>
                          <dd className="font-medium text-right">
                            {locacaoEstaConcluida(loc) && loc.dataDevolucao
                              ? formatarDataHoraLoc(loc.dataDevolucao)
                              : "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Veículo e unidade
                      </h4>
                      <Separator />
                      <dl className="space-y-2 text-sm">
                        {(loc.loja_retirada || loc.loja_devolucao) && (
                          <>
                            {loc.loja_retirada && (
                              <div className="flex justify-between gap-4">
                                <dt className="text-gray-600 shrink-0">Loja retirada</dt>
                                <dd className="font-medium text-right">{loc.loja_retirada}</dd>
                              </div>
                            )}
                            {loc.loja_devolucao && (
                              <div className="flex justify-between gap-4">
                                <dt className="text-gray-600 shrink-0">Loja devolução</dt>
                                <dd className="font-medium text-right">{loc.loja_devolucao}</dd>
                              </div>
                            )}
                          </>
                        )}
                        {(loc.km_inicial != null || loc.km_final != null) && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-gray-600 shrink-0 inline-flex items-center gap-1">
                              <Gauge className="h-4 w-4" />
                              Quilometragem
                            </dt>
                            <dd className="font-medium text-right">
                              {loc.km_inicial != null ? `${loc.km_inicial.toLocaleString("pt-BR")} km` : "—"}
                              {" → "}
                              {loc.km_final != null ? `${loc.km_final.toLocaleString("pt-BR")} km` : "—"}
                            </dd>
                          </div>
                        )}
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-600 shrink-0">ID veículo</dt>
                          <dd className="font-medium text-right">{loc.id_car ?? "—"}</dd>
                        </div>
                      </dl>
                      {loc.observacoes && (
                        <p className="text-xs text-gray-600 bg-gray-50 rounded-md p-3 border mt-2">
                          <span className="font-semibold text-gray-700">Observações: </span>
                          {loc.observacoes}
                        </p>
                      )}
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

  const ListaReservas = ({
    reservas,
    loadingReservas,
  }: {
    reservas: ReservaResponse[];
    loadingReservas: boolean;
  }) => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Minhas reservas</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Visualize agendamentos e cancele os pendentes quando precisar.
          </p>
        </div>
        <Button asChild className="shrink-0 gap-2 w-full sm:w-auto">
          <NavLink to="/frota">
            <PlusCircle className="h-4 w-4" />
            Nova reserva
          </NavLink>
        </Button>
      </div>
      {loadingReservas ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando reservas...</p>
        </div>
      ) : reservas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 space-y-4">
            <Calendar className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma reserva ainda</h3>
              <p className="max-w-md mx-auto">
                Escolha um grupo na frota e conclua sua reserva em poucos passos.
              </p>
            </div>
            <Button asChild className="gap-2">
              <NavLink to="/frota">
                <PlusCircle className="h-4 w-4" />
                Fazer nova reserva
              </NavLink>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...reservas]
            .sort((a, b) => b.id - a.id)
            .map((reserva) => (
            <Card key={reserva.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50 p-3 sm:p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <CardTitle className="text-base sm:text-lg md:text-xl">Reserva #{reserva.id}</CardTitle>
                      {getStatusBadge(reserva.status)}
                      {reserva.status === "pendente" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs sm:text-sm"
                          onClick={() => abrirModalCancelar(reserva.id)}
                          disabled={cancelLoading && reservaIdParaCancelar === reserva.id}
                        >
                          Cancelar
                        </Button>
                      )}
                          <CancelReservationModal
                            open={cancelModalOpen}
                            onClose={() => setCancelModalOpen(false)}
                            onCancel={handleCancelarReserva}
                            loading={cancelLoading}
                          />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Registrada em {formatarDataHora(reserva.dataRegistro)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Coluna Esquerda */}
                  <div className="space-y-4">
                    {/* Veículo */}
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={`/${reserva.grupo.imagem}`}
                          alt={reserva.grupo.nome}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&h=200&fit=crop';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Car className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{reserva.grupo.nome}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Shield className={`w-3 h-3 ${reserva.seguro === "1" ? "text-blue-500" : reserva.seguro === "2" ? "text-yellow-500" : "text-gray-400"}`} />
                          {reserva.seguro === "1" && (
                            <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Seguro Básico</span>
                          )}
                          {reserva.seguro === "2" && (
                            <span className="font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">Seguro Premium</span>
                          )}
                          {reserva.seguro !== "1" && reserva.seguro !== "2" && (
                            <span className="text-gray-500">Sem seguro</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Categoria: <span className="capitalize">{reserva.categoria}</span>
                        </div>
                      </div>
                    </div>

                    {/* Loja */}
                    <div className="p-3 sm:p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">Loja de Retirada</span>
                      </div>
                      <p className="text-xs sm:text-sm">{reserva.lojaRetirada.nome}</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {reserva.lojaRetirada.cidade} - {reserva.lojaRetirada.estado}
                      </p>
                    </div>
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-4">
                    {/* Período */}
                    <div className="p-3 sm:p-4 border rounded-lg bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">Período de Locação</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Retirada</p>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">
                              {formatarData(reserva.periodo.retirada.data)}
                            </span>
                            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-600">
                              {reserva.periodo.retirada.hora}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-600 mb-1">Devolução</p>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">
                              {formatarData(reserva.periodo.devolucao.data)}
                            </span>
                            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-600">
                              {reserva.periodo.devolucao.hora}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total de dias:</span>
                          <span className="font-bold text-lg text-primary">
                            {reserva.qtdDias} {reserva.qtdDias === 1 ? 'dia' : 'dias'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="p-3 sm:p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Origem:</span>
                        <span className="font-medium capitalize">{reserva.origem}</span>
                      </div>
                      {reserva.planoId > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Plano:</span>
                          <span className="font-medium">#{reserva.planoId}</span>
                        </div>
                      )}
                      {reserva.valorDoado && (
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Valor Doado:</span>
                          <span className="font-medium text-green-600">
                            R$ {parseFloat(reserva.valorDoado).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cancelamento */}
                    {reserva.cancelamento && (
                      <div className="p-3 sm:p-4 border border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span className="font-semibold text-red-900 text-sm sm:text-base">Cancelamento</span>
                        </div>
                        <p className="text-xs sm:text-sm text-red-800 mb-1">
                          Data: {formatarDataHora(reserva.cancelamento.data)}
                        </p>
                        <p className="text-xs sm:text-sm text-red-700">
                          Motivo: {reserva.cancelamento.motivo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const ListaManutencao = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Manutenção</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-4">Visualize e gerencie as manutenções dos veículos.</p>
      <Card>
        <CardContent className="py-12 text-center text-gray-400">
          <Activity className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma manutenção cadastrada</h3>
          <p className="text-gray-500">Nenhuma manutenção registrada até o momento.</p>
        </CardContent>
      </Card>
    </div>
  );

  const ListaBoletos = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Boletos de multas</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Consulte pendências de multas de trânsito, linha digitável e links para pagamento em um só lugar.
        </p>
      </div>

      {loadingBoletos ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500">Carregando boletos...</p>
        </div>
      ) : erroBoletos ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8 text-center text-red-800">
            <p className="font-medium">{erroBoletos}</p>
          </CardContent>
        </Card>
      ) : boletosMultas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Receipt className="w-16 h-16 mx-auto mb-4 opacity-80" />
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Nenhum boleto de multa</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Quando houver multas com boleto disponível, elas aparecerão aqui para consulta e pagamento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block rounded-md border bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Placa / auto</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boletosMultas.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium max-w-[220px]">{b.descricao}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {[b.placa, b.autoInfracao].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatarData(b.dataVencimento)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {parseFloat(b.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getBoletoMultaStatusBadge(b.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {b.linhaDigitavel && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copiarLinhaDigitavel(b.linhaDigitavel!)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar linha
                          </Button>
                        )}
                        {b.urlPdf && (
                          <Button type="button" variant="outline" size="sm" asChild>
                            <a href={b.urlPdf} target="_blank" rel="noopener noreferrer">
                              PDF
                            </a>
                          </Button>
                        )}
                        {b.urlPagamento && (
                          <Button type="button" size="sm" asChild>
                            <a href={b.urlPagamento} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Pagar
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4">
            {boletosMultas.map((b) => (
              <Card key={b.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{b.descricao}</CardTitle>
                    {getBoletoMultaStatusBadge(b.status)}
                  </div>
                  <CardDescription>
                    Venc.: {formatarData(b.dataVencimento)} · R${" "}
                    {parseFloat(b.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {b.linhaDigitavel && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copiarLinhaDigitavel(b.linhaDigitavel!)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar linha
                    </Button>
                  )}
                  {b.urlPdf && (
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={b.urlPdf} target="_blank" rel="noopener noreferrer">
                        Abrir PDF
                      </a>
                    </Button>
                  )}
                  {b.urlPagamento && (
                    <Button type="button" size="sm" asChild>
                      <a href={b.urlPagamento} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Pagar
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Componente da Sidebar
  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {/* Logo & Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {sidebarOpen && (
          <a href="/" className="flex items-center">
            <img
              src="https://sistema.klrentacar.com.br/logo/logo-branco-new-semfundo.png"
              alt="KL Rent a Car"
              className="h-8 w-auto brightness-0"
            />
          </a>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {(user?.nome || user?.nome_cli) ? (user.nome || user.nome_cli).charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {(() => {
                  const fullName = (user?.nome || user?.nome_cli || 'Usuário').trim();
                  const parts = fullName.split(' ');
                  if (parts.length === 1) return parts[0];
                  return `${parts[0]} ${parts[parts.length - 1]}`;
                })()}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={`/painel/${item.path}`}
              end={item.path === "dashboard"}
              onClick={() => onItemClick?.()}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors shadow-sm
                ${isActive ? "bg-emerald-500 text-white shadow-md" : "text-gray-700 hover:bg-emerald-50"}
                ${!sidebarOpen ? "justify-center" : ""}`
              }
              style={{ fontWeight: 500, letterSpacing: 0.2 }}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-emerald-600"}`}
                  />
                  {sidebarOpen && (
                    <span
                      className="text-sm font-medium tracking-wide"
                      style={{ fontWeight: isActive ? 600 : 500 }}
                    >
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Buttons */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button
          variant="outline"
          className={`w-full ${!sidebarOpen && "px-2"}`}
          onClick={() => {
            window.location.href = '/';
            onItemClick?.();
          }}
        >
          <LayoutDashboard className="w-5 h-5" />
          {sidebarOpen && <span className="ml-3">Voltar ao Site</span>}
        </Button>
        <Button
          variant="ghost"
          className={`w-full ${!sidebarOpen && "px-2"}`}
          onClick={() => {
            handleLogout();
            onItemClick?.();
          }}
        >
          <LogOut className="w-5 h-5" />
          {sidebarOpen && <span className="ml-3">Sair</span>}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-20`}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[85vw] sm:w-[300px] bg-white p-0">
            <div className="flex flex-col h-full">
              <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 ${
          !isMobile ? (sidebarOpen ? "ml-64" : "ml-20") : ""
        } transition-all duration-300`}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900">
              {tituloCabecalho}
            </h1>
          </div>
          
          {/* User Info & Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(user?.nome || user?.nome_cli) ? (user.nome || user.nome_cli).charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900">
                  {(user?.nome || user?.nome_cli) || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
            </div>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        {/* Content — mesma largura máxima centralizada em todas as seções */}
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto">
          {section === "dashboard" && (
            // Conteúdo do Dashboard original
            <>
              {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="hidden sm:inline">{stat.change} vs mês anterior</span>
                      <span className="sm:hidden">{stat.change}</span>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Receita Mensal</CardTitle>
                <CardDescription>
                  Comparativo dos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Gráfico de receita será exibido aqui
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reservations Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Reservas por Categoria</CardTitle>
                <CardDescription>
                  Distribuição dos veículos mais reservados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Gráfico de reservas será exibido aqui
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>
                Últimas movimentações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.client} - {activity.vehicle}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
            </>
          )}
          {section === "locacao" && <ListaLocacao />}
          {section === "reservas" && <ListaReservas reservas={reservas} loadingReservas={loadingReservas} />}
          {section === "manutencao" && <ListaManutencao />}
          {section === "veiculos" && <ListaDocVeiculos />}
          {section === "boletos" && <ListaBoletos />}
          {section === "configuracoes" && (
            <ConfiguracoesPainel
              user={user}
              onProfileSynced={() => setUser(authService.getUser())}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Painel;
