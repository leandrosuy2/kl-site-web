import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Key, 
  MapPin, 
  Calendar,
  Shield,
  Phone,
  Mail,
  Clock,
  Store
} from "lucide-react";
import { frotaService } from "@/services/frotaService";
import { lojaService } from "@/services/lojaService";
import { planoService } from "@/services/planoService";
import { reservaService } from "@/services/reservaService";
import { Veiculo } from "@/types/frota";
import { Loja } from "@/types/loja";
import { Plano } from "@/types/plano";
import { useToast } from "@/hooks/use-toast";
import { decodeId } from "@/lib/encode";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { CancelReservationModal } from "@/components/landing/CancelReservationModal";
import { authService } from "@/services/authService";
import { savePendingBookingPath } from "@/components/RedirectAfterLogin";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FrotaDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<Veiculo | null>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaSelecionada, setLojaSelecionada] = useState<string>("");
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reservando, setReservando] = useState(false);
  const [tipoLocacao, setTipoLocacao] = useState<"convencional" | "promocional">("convencional");
  const [tipoSeguro, setTipoSeguro] = useState<"basico" | "premium">("basico");
  const [dataRetirada, setDataRetirada] = useState<string>("");
  const [horaRetirada, setHoraRetirada] = useState<string>("08:00");
  const [dataDevolucao, setDataDevolucao] = useState<string>("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reservaIdParaCancelar, setReservaIdParaCancelar] = useState<number | null>(null);

  // Função para calcular próximo dia útil (não domingo)
  const getProximoDiaUtil = (date: Date): Date => {
    const novaDdata = new Date(date);
    if (novaDdata.getDay() === 0) { // Se for domingo
      novaDdata.setDate(novaDdata.getDate() + 1); // Vai para segunda
    }
    return novaDdata;
  };

  // Inicializar data de retirada como amanhã (excluindo domingo)
  useEffect(() => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataUtil = getProximoDiaUtil(amanha);
    const dataFormatada = dataUtil.toISOString().split('T')[0];
    setDataRetirada(dataFormatada);
    
    // Inicializar data de devolução como um dia depois da retirada
    const devolucao = new Date(dataUtil);
    devolucao.setDate(devolucao.getDate() + 1);
    const dataDevolucaoUtil = getProximoDiaUtil(devolucao);
    const dataDevolucaoFormatada = dataDevolucaoUtil.toISOString().split('T')[0];
    setDataDevolucao(dataDevolucaoFormatada);
  }, []);

  // Atualizar data de devolução quando data de retirada mudar ou plano mudar
  useEffect(() => {
    if (dataRetirada) {
      const retirada = new Date(dataRetirada + 'T00:00:00');
      const devolucao = new Date(retirada);
      
      // Se for promocional e tiver plano selecionado, usa qtdMinDias
      if (tipoLocacao === "promocional" && planoSelecionado && planos.length > 0) {
        const plano = planos.find(p => String(p.id) === planoSelecionado);
        if (plano) {
          devolucao.setDate(devolucao.getDate() + plano.qtdMinDias);
        } else {
          devolucao.setDate(devolucao.getDate() + 1);
        }
      } else {
        devolucao.setDate(devolucao.getDate() + 1);
      }
      
      const dataDevolucaoUtil = getProximoDiaUtil(devolucao);
      const dataDevolucaoFormatada = dataDevolucaoUtil.toISOString().split('T')[0];
      
      // No promocional, sempre atualiza. No convencional, só se for anterior
      if (tipoLocacao === "promocional") {
        setDataDevolucao(dataDevolucaoFormatada);
      } else {
        const devolucaoAtual = new Date(dataDevolucao + 'T00:00:00');
        if (!dataDevolucao || devolucaoAtual <= retirada) {
          setDataDevolucao(dataDevolucaoFormatada);
        }
      }
    }
  }, [dataRetirada, tipoLocacao, planoSelecionado, planos]);

  // Validar que a data não seja domingo
  const validarData = (dataStr: string): boolean => {
    const data = new Date(dataStr + 'T00:00:00');
    return data.getDay() !== 0; // Retorna false se for domingo
  };

  const handleDataRetiradaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaData = e.target.value;
    if (validarData(novaData)) {
      setDataRetirada(novaData);
    } else {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "A data de retirada não pode ser um domingo.",
      });
    }
  };

  const handleDataDevolucaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaData = e.target.value;
    
    // Validar que não seja a mesma data da retirada
    if (novaData === dataRetirada) {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "A data de devolução não pode ser igual à data de retirada.",
      });
      return;
    }
    
    if (validarData(novaData)) {
      setDataDevolucao(novaData);
    } else {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "A data de devolução não pode ser um domingo.",
      });
    }
  };

  // Calcular quantidade de diárias
  const calcularDiarias = (): number => {
    if (!dataRetirada || !dataDevolucao) return 0;
    const inicio = new Date(dataRetirada + 'T00:00:00');
    const fim = new Date(dataDevolucao + 'T00:00:00');
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calcular valor da diária (com seguro)
  const calcularValorDiaria = (): number => {
    if (!vehicle) return 0;
    
    // Se for promocional, calcula baseado no plano com seguro
    if (tipoLocacao === "promocional" && planoSelecionado && planos.length > 0) {
      const plano = planos.find(p => String(p.id) === planoSelecionado);
      if (plano && plano.qtdMinDias > 0) {
        const valorBase = parseFloat(plano.valorPretendido);
        
        if (tipoSeguro === "basico") {
          // Básico: valorPretendido / qtdMinDias
          return valorBase / plano.qtdMinDias;
        } else {
          // Premium: (valorPretendido + adicional) / qtdMinDias
          const adicionalPremium = valorBase * 0.24375;
          return (valorBase + adicionalPremium) / plano.qtdMinDias;
        }
      }
    }
    
    // Cálculo convencional com seguro
    const valorBase = parseFloat(vehicle.valorLocacao);
    const percentualSeguro = tipoSeguro === "basico" 
      ? parseFloat(vehicle.seguroBasico || "0")
      : parseFloat(vehicle.seguroPlus || "0");
    
    const valorSeguro = (valorBase * percentualSeguro) / 100;
    return valorBase + valorSeguro;
  };

  // Calcular valor final com seguro e diárias
  const calcularValorFinal = () => {
    const diarias = calcularDiarias();
    
    // Se for promocional e tiver plano selecionado
    if (tipoLocacao === "promocional" && planoSelecionado && planos.length > 0) {
      const plano = planos.find(p => String(p.id) === planoSelecionado);
      if (plano && diarias >= plano.qtdMinDias) {
        const valorBase = parseFloat(plano.valorPretendido);
        
        // No promocional, o seguro é aplicado sobre o valor pretendido total
        if (tipoSeguro === "basico") {
          // Básico: valor pretendido sem alteração
          return valorBase.toFixed(2);
        } else {
          // Premium: valor pretendido + 24.375% (diferença para chegar ao premium)
          // Cálculo: 2400 + (2400 * 0.24375) = 2985
          const adicionalPremium = valorBase * 0.24375;
          return (valorBase + adicionalPremium).toFixed(2);
        }
      }
    }
    
    // Cálculo convencional
    const valorDiaria = calcularValorDiaria();
    const total = valorDiaria * diarias;
    return total > 0 ? total.toFixed(2) : "0";
  };

  useEffect(() => {
    const carregarDetalhes = async () => {
      if (!id) {
        navigate("/frota");
        return;
      }

      const decoded = decodeId(id);
      if (!decoded) {
        toast({
          variant: "destructive",
          title: "Link inválido",
          description: "Não foi possível carregar os detalhes do veículo.",
        });
        navigate("/frota");
        return;
      }

      try {
        
        // Buscar lojas com base no estadoId
        const lojasData = await lojaService.listarLojas(decoded.estadoId);
        setLojas(lojasData);
        
        // Selecionar primeira loja por padrão
        if (lojasData.length > 0) {
          setLojaSelecionada(String(lojasData[0].id));
        }
        
        const data = await frotaService.buscarVeiculoPorId(decoded.id, decoded.estadoId);
        setVehicle(data);
        
        // Buscar planos promocionais
        const planosData = await planoService.listarPlanos(decoded.id, decoded.estadoId);
        console.log('Planos recebidos:', planosData);
        setPlanos(planosData);
        
        // Selecionar primeiro plano por padrão
        if (planosData.length > 0) {
          setPlanoSelecionado(String(planosData[0].id));
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar detalhes",
          description: "Não foi possível carregar as informações do veículo.",
        });
        navigate("/frota");
      } finally {
        setLoading(false);
      }
    };

    carregarDetalhes();
  }, [id, navigate, toast]);

  // Função para criar a reserva
  const handleReservar = async () => {
    if (!authService.isAuthenticated()) {
      savePendingBookingPath(window.location.pathname + window.location.search);
      toast({
        title: "Faça login para agendar",
        description: "Entre na sua conta ou cadastre-se. Você voltará a esta tela para concluir a reserva.",
      });
      navigate("/");
      return;
    }

    // Validações
    if (!lojaSelecionada) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma loja de retirada.",
      });
      return;
    }

    if (!dataRetirada || !dataDevolucao) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione as datas de retirada e devolução.",
      });
      return;
    }

    if (tipoLocacao === "promocional" && !planoSelecionado) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um plano promocional.",
      });
      return;
    }

    try {
      setReservando(true);

      const diasLocacao = calcularDiarias();

      // Lógica para categoria e campos do cadastro
      // categoria deve ser "basico" ou "premium"
      let categoriaEnvio: "basico" | "premium" = tipoSeguro;
      let planoEnvio = tipoLocacao === "promocional" && planoSelecionado ? parseInt(planoSelecionado) : 0;
      let vlrDoadoEnvio = null;

      const reservaCriada = await reservaService.criarReserva({
        id_loja: parseInt(lojaSelecionada) || 0,
        loja_dev: null,
        data_retirada: dataRetirada,
        hora_retirada: horaRetirada,
        data_devolucao: dataDevolucao,
        hora_devolucao: "18:00", // Horário padrão de devolução
        grupo_escolhido: vehicle?.id || 0,
        plano_escolhido: planoEnvio,
        categoria: categoriaEnvio,
        vlr_doado: vlrDoadoEnvio,
        seguro_escolhido: tipoSeguro,
        qtd_dias: diasLocacao,
        origem_agen: "site",
      });

      if (reservaCriada && reservaCriada.id) {
        console.log("Reserva criada com ID:", reservaCriada.id);
      }
      toast({
        title: "Reserva realizada!",
        description:
          "Sua reserva foi registrada. Acompanhe o status em Painel → Reservas. Após a retirada do veículo, o contrato aparece em Painel → Locação.",
      });

      setTimeout(() => {
        navigate("/painel/reservas");
      }, 2000);

    } catch (error: any) {
      console.error("Erro ao criar reserva:", error);
      toast({
        variant: "destructive",
        title: "Erro ao reservar",
        description: error.response?.data?.message || "Não foi possível realizar a reserva. Tente novamente.",
      });
    } finally {
      setReservando(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando detalhes...</p>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  const beneficios = [
    { icon: Shield, label: "Seguro Incluso", desc: "Proteção total durante a locação" },
    { icon: Clock, label: "Atendimento 24h", desc: "Suporte a qualquer momento" },
    { icon: Calendar, label: "Sem Multa", desc: "Cancele com até 24h de antecedência" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <Button
            variant="ghost"
            className="mb-6 -ml-4"
            onClick={() => navigate("/frota")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para frota
          </Button>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Imagem */}
            <div>
              <Card className="overflow-hidden">
                <div className="relative h-96 bg-muted">
                  <img
                    src={`/${vehicle.imagem}`}
                    alt={`Grupo ${vehicle.nome}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop';
                    }}
                  />
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">Grupo {vehicle.nome}</h1>
                      {vehicle.descricao && (
                        <p className="text-muted-foreground">{vehicle.descricao}</p>
                      )}
                    </div>
                    <Separator />
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{vehicle.estado}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-primary" />
                        <span className="font-semibold">R$ {vehicle.valorLocacao}/dia</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Informações */}
            <div>
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Agendar locação</h2>
                      {!authService.isAuthenticated() && (
                        <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950">
                          <AlertDescription>
                            Para concluir o agendamento, faça login ou cadastre-se. Use o botão no topo do site.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Tipo de Locação */}
                      <div className="space-y-2 mb-4">
                        <Label>Tipo de Locação</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={tipoLocacao === "convencional" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => {
                              setTipoLocacao("convencional");
                              setPlanoSelecionado("");
                            }}
                          >
                            Convencional
                          </Button>
                          <Button
                            variant={tipoLocacao === "promocional" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setTipoLocacao("promocional")}
                            disabled={planos.length === 0}
                          >
                            Promocional
                          </Button>
                        </div>
                      </div>

                      {/* Plano Promocional */}
                      {tipoLocacao === "promocional" && planos.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <Label>Plano Promocional</Label>
                          <Select value={planoSelecionado} onValueChange={setPlanoSelecionado}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                              {planos.map((plano) => (
                                <SelectItem key={plano.id} value={String(plano.id)}>
                                  {plano.qtdMinDias} dias - R$ {plano.valorPretendido}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Loja de Retirada */}
                      <div className="space-y-2 mb-4">
                        <Label>Loja de Retirada</Label>
                        <Select value={lojaSelecionada} onValueChange={setLojaSelecionada}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma loja" />
                          </SelectTrigger>
                          <SelectContent>
                            {lojas.map((loja) => (
                              <SelectItem key={loja.id} value={String(loja.id)}>
                                <div className="flex items-center gap-2">
                                  <Store className="w-4 h-4" />
                                  <span>{loja.nome}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Data e Hora de Retirada */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label>Data de Retirada</Label>
                          <Input
                            type="date"
                            value={dataRetirada}
                            onChange={handleDataRetiradaChange}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hora de Retirada</Label>
                          <Input
                            type="time"
                            value={horaRetirada}
                            onChange={(e) => setHoraRetirada(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Data de Devolução */}
                      <div className="space-y-2 mb-4">
                        <Label>Data de Devolução</Label>
                        <Input
                          type="date"
                          value={dataDevolucao}
                          onChange={handleDataDevolucaoChange}
                          min={dataRetirada || new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      {/* Tipo de Seguro */}
                      <div className="space-y-2 mb-4">
                        <Label>Tipo de Seguro</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={tipoSeguro === "basico" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setTipoSeguro("basico")}
                          >
                            Básico
                          </Button>
                          <Button
                            variant={tipoSeguro === "premium" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setTipoSeguro("premium")}
                          >
                            Premium
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Resumo */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Diárias:</span>
                          <span className="font-semibold">{calcularDiarias()} dias</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Valor por diária:</span>
                          <span className="font-semibold">R$ {calcularValorDiaria().toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">R$ {calcularValorFinal()}</span>
                        </div>
                      </div>

                      {/* Botão de Reservar */}
                      <Button
                        className="w-full mt-6"
                        size="lg"
                        onClick={handleReservar}
                        disabled={reservando}
                      >
                        {reservando ? "Reservando..." : "Reservar Agora"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Benefícios */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Benefícios Inclusos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {beneficios.map((beneficio, index) => {
                        const Icon = beneficio.icon;
                        return (
                          <div key={index} className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <p className="font-semibold text-sm">{beneficio.label}</p>
                            <p className="text-xs text-muted-foreground">{beneficio.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CancelReservationModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onCancel={handleCancelarReserva}
        loading={cancelLoading}
      />
      <Footer />
    </div>
  );
};

export default FrotaDetalhes;
