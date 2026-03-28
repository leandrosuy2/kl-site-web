import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import ForgotPasswordModal from "@/components/landing/ForgotPasswordModal";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  KeyRound,
  Home,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

const MARKETING_PREF_KEY = "kl_prefs_marketing_email";

type UserRecord = Record<string, unknown> | null;

function nomeCompletoUsuario(u: UserRecord): string {
  if (!u) return "";
  const n = (u.nome ?? u.nome_cli) as string | undefined;
  return (n || "").trim();
}

function nomeExibicao(u: UserRecord): string {
  const full = nomeCompletoUsuario(u);
  if (!full) return "Usuário";
  const parts = full.split(/\s+/);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function emailUsuario(u: UserRecord): string {
  if (!u || typeof u.email !== "string") return "";
  return u.email;
}

export interface ConfiguracoesPainelProps {
  user: UserRecord;
  onProfileSynced: () => void;
}

const ConfiguracoesPainel = ({ user, onProfileSynced }: ConfiguracoesPainelProps) => {
  const { toast } = useToast();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaNova2, setSenhaNova2] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showSenhaNova, setShowSenhaNova] = useState(false);
  const [showSenhaNova2, setShowSenhaNova2] = useState(false);

  useEffect(() => {
    setNome(nomeCompletoUsuario(user));
    setEmail(emailUsuario(user));
  }, [user]);

  useEffect(() => {
    try {
      setMarketingOptIn(localStorage.getItem(MARKETING_PREF_KEY) === "1");
    } catch {
      setMarketingOptIn(false);
    }
  }, []);

  const handleMarketingChange = (checked: boolean) => {
    setMarketingOptIn(checked);
    try {
      localStorage.setItem(MARKETING_PREF_KEY, checked ? "1" : "0");
      toast({
        title: checked ? "Preferência salva" : "Atualizado",
        description: checked
          ? "Você passará a receber novidades quando enviarmos campanhas."
          : "Promoções por e-mail desativadas neste dispositivo.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar",
        description: "Permita armazenamento local no navegador.",
      });
    }
  };

  const handleSalvarDadosConta = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeTrim = nome.trim();
    const emailTrim = email.trim().toLowerCase();
    if (!nomeTrim) {
      toast({ variant: "destructive", title: "Informe seu nome completo" });
      return;
    }
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      toast({ variant: "destructive", title: "E-mail inválido" });
      return;
    }
    setSavingProfile(true);
    try {
      await authService.updateProfile({ nome: nomeTrim, email: emailTrim });
      onProfileSynced();
      toast({
        title: "Dados salvos",
        description: "Nome e e-mail foram atualizados.",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Não foi possível salvar.";
      toast({ variant: "destructive", title: "Erro ao salvar", description: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSalvarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual) {
      toast({ variant: "destructive", title: "Informe a senha atual" });
      return;
    }
    if (senhaNova.length < 6) {
      toast({ variant: "destructive", title: "A nova senha deve ter pelo menos 6 caracteres" });
      return;
    }
    if (senhaNova !== senhaNova2) {
      toast({ variant: "destructive", title: "A confirmação não coincide com a nova senha" });
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({ senha_atual: senhaAtual, senha_nova: senhaNova });
      setSenhaAtual("");
      setSenhaNova("");
      setSenhaNova2("");
      toast({
        title: "Senha alterada",
        description: "Use a nova senha no próximo login.",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Não foi possível alterar a senha.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  const emailCadastrado = emailUsuario(user);

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Minha conta</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Atualize seu nome, e-mail e senha quando precisar.
          </p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0" asChild>
          <NavLink to="/">
            <Home className="h-4 w-4" />
            Voltar ao site
          </NavLink>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="hover:shadow-lg transition-shadow border-gray-200">
          <CardHeader className="bg-gray-50 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary shrink-0" />
              Meus dados
            </CardTitle>
            <CardDescription>Como você aparece ao entrar e ao usar o painel</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <form onSubmit={handleSalvarDadosConta} className="space-y-4">
              <div className="flex items-center gap-4 pb-1">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border border-gray-200 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {(nome.trim() || nomeExibicao(user)).charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-gray-600">
                  Foto do perfil usa a inicial do seu nome.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-nome">Nome completo</Label>
                <Input
                  id="cfg-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Maria Silva Santos"
                  autoComplete="name"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cfg-email"
                    type="email"
                    className="pl-9 placeholder:text-muted-foreground"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@provedor.com.br"
                    autoComplete="email"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={savingProfile}>
                {savingProfile ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-gray-200">
          <CardHeader className="bg-gray-50 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary shrink-0" />
              Senha
            </CardTitle>
            <CardDescription>Informe a senha que você usa hoje e escolha uma nova</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
            <form onSubmit={handleSalvarSenha} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cfg-senha-atual">Senha atual</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cfg-senha-atual"
                    type={showSenhaAtual ? "text" : "password"}
                    className="pl-9 pr-10 placeholder:text-muted-foreground"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Digite a senha que você usa hoje"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    onClick={() => setShowSenhaAtual((v) => !v)}
                    tabIndex={-1}
                    aria-label={showSenhaAtual ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-senha-nova">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="cfg-senha-nova"
                    type={showSenhaNova ? "text" : "password"}
                    className="pr-10 placeholder:text-muted-foreground"
                    value={senhaNova}
                    onChange={(e) => setSenhaNova(e.target.value)}
                    placeholder="Nova senha (mín. 6 caracteres)"
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    onClick={() => setShowSenhaNova((v) => !v)}
                    tabIndex={-1}
                    aria-label={showSenhaNova ? "Ocultar" : "Mostrar"}
                  >
                    {showSenhaNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-senha-nova2">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="cfg-senha-nova2"
                    type={showSenhaNova2 ? "text" : "password"}
                    className="pr-10 placeholder:text-muted-foreground"
                    value={senhaNova2}
                    onChange={(e) => setSenhaNova2(e.target.value)}
                    placeholder="Digite a nova senha de novo"
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    onClick={() => setShowSenhaNova2((v) => !v)}
                    tabIndex={-1}
                    aria-label={showSenhaNova2 ? "Ocultar" : "Mostrar"}
                  >
                    {showSenhaNova2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={savingPassword}>
                {savingPassword ? "Alterando..." : "Alterar senha"}
              </Button>
            </form>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Não lembra da senha atual?</p>
              <Button type="button" variant="outline" className="w-full" onClick={() => setForgotOpen(true)}>
                Enviar link de redefinição para {emailCadastrado || "seu e-mail"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gray-50 p-3 sm:p-4 md:p-6 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Preferências</CardTitle>
          <CardDescription>O que você quer receber da KL</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3">
            <div className="space-y-0.5 min-w-0">
              <Label htmlFor="marketing-email" className="text-sm font-medium text-gray-900">
                Novidades e promoções por e-mail
              </Label>
              <p className="text-xs text-gray-500">Você pode mudar isso quando quiser.</p>
            </div>
            <Switch
              id="marketing-email"
              className="sm:shrink-0"
              checked={marketingOptIn}
              onCheckedChange={handleMarketingChange}
            />
          </div>
        </CardContent>
      </Card>

      <ForgotPasswordModal
        isOpen={forgotOpen}
        onClose={() => setForgotOpen(false)}
        defaultEmail={emailCadastrado || undefined}
      />
    </div>
  );
};

export default ConfiguracoesPainel;
