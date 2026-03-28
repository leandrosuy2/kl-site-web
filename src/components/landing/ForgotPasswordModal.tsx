import { useState } from "react";
import { Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pré-preenche o e-mail (ex.: tela de configurações logada) */
  defaultEmail?: string;
}

const ForgotPasswordModal = ({ isOpen, onClose, defaultEmail }: ForgotPasswordModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      await authService.forgotPassword({ email });
      
      toast({
        title: "E-mail enviado com sucesso! 📧",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar e-mail ❌",
        description: error.message || "Não foi possível enviar o e-mail de recuperação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Recuperar senha 🔑</DialogTitle>
          <DialogDescription className="text-center">
            Digite seu e-mail e enviaremos instruções para redefinir sua senha
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="forgot-email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                key={defaultEmail ?? "forgot-email"}
                id="forgot-email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                disabled={isLoading}
                required
                defaultValue={defaultEmail ?? ""}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar instruções"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Lembrou sua senha?{" "}
            <button
              type="button"
              onClick={onClose}
              className="text-primary font-semibold hover:underline"
            >
              Voltar ao login
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
