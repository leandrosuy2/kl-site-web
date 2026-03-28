import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, MapPin, Briefcase, Phone, Mail, Lock, FileText, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { clienteService } from "@/services/clienteService";
import type { CadastrarClienteRequest } from "@/types/cliente";

// Lista de estados do Brasil
const estadosBrasil = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const CadastroPF = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    // Identificação
    tipoPessoa: "PF",
    cpf: "",
    nomeCompleto: "",
    primeiroNome: "",
    cnhNumero: "",
    cnhUf: "",
    cnhVencimento: "",
    identidade: "",
    orgIdentidade: "",
    nascimento: "",
    estadocivil: "",
    sexo: "",
    nomeMae: "",
    nacionalidade: "",
    
    // Endereço
    cep: "",
    rua: "",
    complemento: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    enderecoTrabalho: "",
    pais: "Brasil",
    
    // Profissão
    descricaoProfissao: "",
    profissao: "",
    profissao2: "",
    
    // Contato - Arrays para múltiplos telefones e emails
    telefones: [{ ddd: "", numero: "", nome: "" }],
    emails: [{ email: "", descricao: "" }],
    
    // Acesso
    senha: "",
    confirmarSenha: "",
    lojaId: "1", // Valor padrão, pode ser ajustado
    
    // Informações Adicionais
    outrasInformacoes: "",
    residencia: "",
    tempoResidencia: "",
    tipoTrabalho: "",
    tempoTrabalho: "",
    financiamento: "",
    cnh: ""
  });

  // Função para formatar CPF
  const formatarCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2');
    }
    return value;
  };

  // Função para formatar CEP
  const formatarCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  // Função para formatar telefone (sem DDD, apenas número)
  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{4})(\d)/, '$1-$2');
    }
    if (numbers.length <= 9) {
      return numbers.replace(/^(\d{5})(\d{4})$/, '$1-$2');
    }
    return value;
  };

  // Função para formatar data (dd/mm/aaaa)
  const formatarData = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1/$2')
        .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    }
    return value;
  };

  // Função para converter data de dd/mm/aaaa para aaaa-mm-dd
  const converterDataParaAPI = (data: string): string => {
    if (!data || data.length < 10) return "";
    const partes = data.split('/');
    if (partes.length === 3 && partes[0].length === 2 && partes[1].length === 2 && partes[2].length === 4) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return "";
  };

  // Função para remover formatação (apenas números)
  const removerFormatacao = (valor: string): string => {
    return valor.replace(/\D/g, '');
  };

  // Funções para gerenciar telefones
  const adicionarTelefone = () => {
    setFormData(prev => ({
      ...prev,
      telefones: [...prev.telefones, { ddd: "", numero: "", nome: "" }]
    }));
  };

  const removerTelefone = (index: number) => {
    if (formData.telefones.length > 1) {
      setFormData(prev => ({
        ...prev,
        telefones: prev.telefones.filter((_, i) => i !== index)
      }));
    }
  };

  const atualizarTelefone = (index: number, field: 'ddd' | 'numero' | 'nome', value: string) => {
    setFormData(prev => {
      const novosTelefones = [...prev.telefones];
      if (field === 'numero') {
        novosTelefones[index][field] = formatarTelefone(value);
      } else if (field === 'ddd') {
        novosTelefones[index][field] = value.replace(/\D/g, '').slice(0, 2);
      } else {
        novosTelefones[index][field] = value;
      }
      return { ...prev, telefones: novosTelefones };
    });
  };

  // Funções para gerenciar emails
  const adicionarEmail = () => {
    setFormData(prev => ({
      ...prev,
      emails: [...prev.emails, { email: "", descricao: "" }]
    }));
  };

  const removerEmail = (index: number) => {
    if (formData.emails.length > 1) {
      setFormData(prev => ({
        ...prev,
        emails: prev.emails.filter((_, i) => i !== index)
      }));
    }
  };

  const atualizarEmail = (index: number, field: 'email' | 'descricao', value: string) => {
    setFormData(prev => {
      const novosEmails = [...prev.emails];
      novosEmails[index][field] = value;
      return { ...prev, emails: novosEmails };
    });
  };

  // Buscar endereço pelo CEP
  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro || prev.rua,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    let formattedValue = value;

    // Aplicar formatação conforme o campo
    if (field === 'cpf') {
      formattedValue = formatarCPF(value);
    } else if (field === 'cep') {
      formattedValue = formatarCEP(value);
      if (formattedValue.replace(/\D/g, '').length === 8) {
        buscarCEP(formattedValue);
      }
    } else if (field === 'telefone') {
      formattedValue = formatarTelefone(value);
    } else if (field === 'cnhVencimento' || field === 'nascimento') {
      formattedValue = formatarData(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validações básicas
    if (formData.senha !== formData.confirmarSenha) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem.",
      });
      setIsLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Mapear dados do formulário para a estrutura da API
      const dadosAPI: CadastrarClienteRequest = {
        cep_cli: removerFormatacao(formData.cep),
        cidade_cli: formData.cidade,
        cpf_cli: removerFormatacao(formData.cpf),
        senha_cli: formData.senha,
        endereco_rua_cli: formData.rua,
        identidade_cli: formData.identidade || undefined,
        org_identidade_cli: formData.orgIdentidade || undefined,
        nome_cli: formData.nomeCompleto,
        tipo_pessoa_cli: 1, // 1 = Pessoa Física
        loja_id_cli: parseInt(formData.lojaId) || 1,
        bairro_cli: formData.bairro,
        endereco_num_cli: formData.numero,
        endereco_trabalho_cli: formData.enderecoTrabalho || undefined,
        endereco_uf_cli: formData.estado,
        fone_cli: formData.telefones[0] ? `${formData.telefones[0].ddd}${removerFormatacao(formData.telefones[0].numero)}` : "",
        hab_uf_cli: formData.cnhUf,
        hab_validade_cli: converterDataParaAPI(formData.cnhVencimento),
        habilitacao_cli: formData.cnhNumero,
        nascimento_cli: converterDataParaAPI(formData.nascimento) || undefined,
        primeiro_nome: formData.primeiroNome || formData.nomeCompleto.split(' ')[0] || undefined,
        estadocivil_cli: formData.estadocivil || undefined,
        sexo_cli: formData.sexo || undefined,
        nome_mae_cli: formData.nomeMae || undefined,
        obs_cli: formData.outrasInformacoes || undefined,
        pais_cli: formData.pais || "Brasil",
        profissao_cli: formData.profissao || formData.descricaoProfissao || undefined,
        profissao2_cli: formData.profissao2 || undefined,
        fones_novos: formData.telefones
          .filter(t => t.ddd && t.numero)
          .map(t => ({
            ddd_fone: t.ddd,
            numero_fone: removerFormatacao(t.numero),
            nome_fone: t.nome || undefined
          })),
        emails_novos: formData.emails
          .filter(e => e.email)
          .map(e => ({
            endereco_email: e.email,
            descricao_email: e.descricao || undefined
          }))
      };

      await clienteService.cadastrarCliente(dadosAPI);
      
      toast({
        title: "Cadastro realizado com sucesso! ✅",
        description: "Sua conta foi criada. Bem-vindo!",
      });

      // Redirecionar após sucesso
      setTimeout(() => {
        navigate("/painel/dashboard");
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar ❌",
        description: error.message || "Não foi possível realizar o cadastro.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <Button
            variant="ghost"
            className="mb-6 -ml-4"
            onClick={() => navigate("/cadastro")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Cadastro - Pessoa Física</h1>
            <p className="text-muted-foreground">
              Preencha todos os campos para criar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Identificação */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoPessoa">Tipo de Pessoa</Label>
                    <Input
                      id="tipoPessoa"
                      value="Pessoa Física"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleChange('cpf', e.target.value)}
                      maxLength={14}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                  <Input
                    id="nomeCompleto"
                    placeholder="Nome completo"
                    value={formData.nomeCompleto}
                    onChange={(e) => handleChange('nomeCompleto', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo *</Label>
                  <Select
                    value={formData.sexo}
                    onValueChange={(value) => handleChange('sexo', value)}
                    required
                  >
                    <SelectTrigger id="sexo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nascimento">Data de Nascimento *</Label>
                  <Input
                    id="nascimento"
                    placeholder="dd/mm/aaaa"
                    value={formData.nascimento}
                    onChange={(e) => handleChange('nascimento', e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="identidade">RG</Label>
                    <Input
                      id="identidade"
                      placeholder="RG"
                      value={formData.identidade}
                      onChange={(e) => handleChange('identidade', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgIdentidade">Órgão Expedidor</Label>
                    <Input
                      id="orgIdentidade"
                      placeholder="ÓRGÃO EXPEDITOR"
                      value={formData.orgIdentidade}
                      onChange={(e) => handleChange('orgIdentidade', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nacionalidade">Nacionalidade</Label>
                  <Input
                    id="nacionalidade"
                    placeholder="NACIONALIDADE"
                    value={formData.nacionalidade}
                    onChange={(e) => handleChange('nacionalidade', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estadocivil">Estado Civil</Label>
                  <Select
                    value={formData.estadocivil}
                    onValueChange={(value) => handleChange('estadocivil', value)}
                  >
                    <SelectTrigger id="estadocivil">
                      <SelectValue placeholder="Solteiro(a)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="Casado">Casado(a)</SelectItem>
                      <SelectItem value="Divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="Viúvo">Viúvo(a)</SelectItem>
                      <SelectItem value="União Estável">União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profissao">Profissão</Label>
                  <Input
                    id="profissao"
                    placeholder="PROFISSÃO"
                    value={formData.profissao}
                    onChange={(e) => handleChange('profissao', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeMae">Nome da Mãe</Label>
                  <Input
                    id="nomeMae"
                    placeholder="NOME DA MÃE"
                    value={formData.nomeMae}
                    onChange={(e) => handleChange('nomeMae', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnhNumero">CNH nº *</Label>
                    <Input
                      id="cnhNumero"
                      placeholder="Nº CNH"
                      value={formData.cnhNumero}
                      onChange={(e) => handleChange('cnhNumero', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnhUf">UF *</Label>
                    <Select
                      value={formData.cnhUf}
                      onValueChange={(value) => handleChange('cnhUf', value)}
                      required
                    >
                      <SelectTrigger id="cnhUf">
                        <SelectValue placeholder="Selecione um estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosBrasil.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnhVencimento">Vencimento *</Label>
                    <Input
                      id="cnhVencimento"
                      placeholder="dd/mm/aaaa"
                      value={formData.cnhVencimento}
                      onChange={(e) => handleChange('cnhVencimento', e.target.value)}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => handleChange('cep', e.target.value)}
                      maxLength={9}
                      required
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="rua">Rua *</Label>
                    <Input
                      id="rua"
                      placeholder="RUA"
                      value={formData.rua}
                      onChange={(e) => handleChange('rua', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      placeholder="Nº"
                      value={formData.numero}
                      onChange={(e) => handleChange('numero', e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      placeholder="COMPLEMENTO"
                      value={formData.complemento}
                      onChange={(e) => handleChange('complemento', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro *</Label>
                    <Input
                      id="bairro"
                      placeholder="BAIRRO"
                      value={formData.bairro}
                      onChange={(e) => handleChange('bairro', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      placeholder="CIDADE"
                      value={formData.cidade}
                      onChange={(e) => handleChange('cidade', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => handleChange('estado', value)}
                      required
                    >
                      <SelectTrigger id="estado">
                        <SelectValue placeholder="ESTADO" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosBrasil.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profissão / Atividade */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Profissão / Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profissao">Profissão Principal *</Label>
                    <Input
                      id="profissao"
                      placeholder="Ex: Engenheiro"
                      value={formData.profissao}
                      onChange={(e) => handleChange('profissao', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profissao2">Profissão Secundária</Label>
                    <Input
                      id="profissao2"
                      placeholder="Ex: Professor"
                      value={formData.profissao2}
                      onChange={(e) => handleChange('profissao2', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricaoProfissao">Descreva sua Profissão</Label>
                  <Textarea
                    id="descricaoProfissao"
                    placeholder="EX: Advogado : Atuo em causas de direito do consumidor, etc..."
                    value={formData.descricaoProfissao}
                    onChange={(e) => handleChange('descricaoProfissao', e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enderecoTrabalho">Endereço de Trabalho</Label>
                  <Input
                    id="enderecoTrabalho"
                    placeholder="Ex: Av. Brasil, 123"
                    value={formData.enderecoTrabalho}
                    onChange={(e) => handleChange('enderecoTrabalho', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contato - Telefones */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  FONE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.telefones.map((telefone, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-2 space-y-2">
                        <Label>DDD</Label>
                        <Input
                          placeholder="00"
                          value={telefone.ddd}
                          onChange={(e) => atualizarTelefone(index, 'ddd', e.target.value)}
                          maxLength={2}
                          required={index === 0}
                        />
                      </div>
                      <div className="md:col-span-4 space-y-2">
                        <Label>Número</Label>
                        <Input
                          placeholder="00000-0000"
                          value={telefone.numero}
                          onChange={(e) => atualizarTelefone(index, 'numero', e.target.value)}
                          maxLength={11}
                          required={index === 0}
                        />
                      </div>
                      <div className="md:col-span-5 space-y-2">
                        <Label>Nome</Label>
                        <Input
                          placeholder="Nome"
                          value={telefone.nome}
                          onChange={(e) => atualizarTelefone(index, 'nome', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        {formData.telefones.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removerTelefone(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={adicionarTelefone}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Telefone
                </Button>
              </CardContent>
            </Card>

            {/* Contato - Emails */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  E-mail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.emails.map((email, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6 space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={email.email}
                          onChange={(e) => atualizarEmail(index, 'email', e.target.value)}
                          required={index === 0}
                        />
                      </div>
                      <div className="md:col-span-5 space-y-2">
                        <Label>Descrição</Label>
                        <Input
                          placeholder="Descrição"
                          value={email.descricao}
                          onChange={(e) => atualizarEmail(index, 'descricao', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        {formData.emails.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removerEmail(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={adicionarEmail}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Email
                </Button>
              </CardContent>
            </Card>

            {/* Acesso ao Sistema */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Senha (acesso ao app ou site kl)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.senha}
                      onChange={(e) => handleChange('senha', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={formData.confirmarSenha}
                      onChange={(e) => handleChange('confirmarSenha', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      placeholder="País"
                      value={formData.pais}
                      onChange={(e) => handleChange('pais', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lojaId">Loja *</Label>
                    <Input
                      id="lojaId"
                      type="number"
                      placeholder="ID da loja"
                      value={formData.lojaId}
                      onChange={(e) => handleChange('lojaId', e.target.value)}
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outrasInformacoes">Outras informações:</Label>
                  <Textarea
                    id="outrasInformacoes"
                    placeholder="Outras informações:"
                    value={formData.outrasInformacoes}
                    onChange={(e) => handleChange('outrasInformacoes', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="residencia">Residência</Label>
                    <Select
                      value={formData.residencia}
                      onValueChange={(value) => handleChange('residencia', value)}
                    >
                      <SelectTrigger id="residencia">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="propria">Própria</SelectItem>
                        <SelectItem value="alugada">Alugada</SelectItem>
                        <SelectItem value="cedida">Cedida</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tempoResidencia">Tempo de Residência</Label>
                    <Select
                      value={formData.tempoResidencia}
                      onValueChange={(value) => handleChange('tempoResidencia', value)}
                    >
                      <SelectTrigger id="tempoResidencia">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="menos-1-ano">Menos de 1 ano</SelectItem>
                        <SelectItem value="1-3-anos">1 a 3 anos</SelectItem>
                        <SelectItem value="3-5-anos">3 a 5 anos</SelectItem>
                        <SelectItem value="mais-5-anos">Mais de 5 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoTrabalho">Tipo de Trabalho</Label>
                    <Select
                      value={formData.tipoTrabalho}
                      onValueChange={(value) => handleChange('tipoTrabalho', value)}
                    >
                      <SelectTrigger id="tipoTrabalho">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="empresa-propria">Empresa Própria</SelectItem>
                        <SelectItem value="autonomo">Autônomo</SelectItem>
                        <SelectItem value="clt">CLT</SelectItem>
                        <SelectItem value="societario">Societário</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tempoTrabalho">Tempo de Trabalho</Label>
                    <Select
                      value={formData.tempoTrabalho}
                      onValueChange={(value) => handleChange('tempoTrabalho', value)}
                    >
                      <SelectTrigger id="tempoTrabalho">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="menos-1-ano">Menos de 1 ano</SelectItem>
                        <SelectItem value="1-3-anos">1 a 3 anos</SelectItem>
                        <SelectItem value="3-5-anos">3 a 5 anos</SelectItem>
                        <SelectItem value="mais-5-anos">Mais de 5 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="financiamento">Financiamento</Label>
                    <Select
                      value={formData.financiamento}
                      onValueChange={(value) => handleChange('financiamento', value)}
                    >
                      <SelectTrigger id="financiamento">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="possui">Possui</SelectItem>
                        <SelectItem value="nao-possui">Não possui</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnh">CNH</Label>
                    <Select
                      value={formData.cnh}
                      onValueChange={(value) => handleChange('cnh', value)}
                    >
                      <SelectTrigger id="cnh">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="propria">Própria</SelectItem>
                        <SelectItem value="terceiro">Terceiro</SelectItem>
                        <SelectItem value="avalista">Avalista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            {/* Botões de Ação */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/cadastro")}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="min-w-[150px]"
              >
                {isLoading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CadastroPF;

