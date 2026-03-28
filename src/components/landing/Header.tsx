import { useState, useEffect } from "react";
import { Menu, X, Car, Zap, Handshake, Shield, AlertTriangle, Scale, LogIn, UserPlus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { authService } from "@/services/authService";

const navLinks = [
  { label: "LOCAÇÃO", icon: Car, href: "/frota", internal: true },
  { label: "FREEDOM", icon: Zap, href: "http://klfreedom.com.br/", external: true },
  { label: "PARCEIRO BESTCAR", icon: Handshake, href: "https://bestcar.com.br/", external: true },
  { label: "INTEGRIDADE", icon: Shield, href: "#integridade" },
  { label: "DENÚNCIA", icon: AlertTriangle, href: "#denuncia" },
  { label: "IGUALDADE SALARIAL", icon: Scale, href: "#igualdade-salarial" },
];

interface HeaderProps {
  transparent?: boolean;
}

const Header = ({ transparent = false }: HeaderProps = {}) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [user, setUser] = useState<{ id: number; nome?: string; nome_cli?: string; email: string } | null>(null);

  useEffect(() => {
    // Verificar se há usuário logado
    const loggedUser = authService.getUser();
    setUser(loggedUser);

    // Listener para mudanças no localStorage
    const handleStorageChange = () => {
      const loggedUser = authService.getUser();
      setUser(loggedUser);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOpenLogin = () => {
    setIsRegisterOpen(false);
    setIsForgotPasswordOpen(false);
    setIsLoginOpen(true);
  };

  const handleOpenRegister = () => {
    // Redirecionar para página de cadastro ao invés de abrir modal
    navigate("/cadastro");
  };

  const handleOpenForgotPassword = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
    setIsForgotPasswordOpen(true);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <>
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-40 transition-all duration-300",
        isScrolled || !transparent
          ? "bg-background/95 backdrop-blur-md shadow-soft py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img
              src="https://sistema.klrentacar.com.br/logo/logo-branco-new-semfundo.png"
              alt="KL Rent a Car"
              className={cn(
                "h-10 w-auto transition-all duration-300",
                (isScrolled || !transparent) ? "brightness-0" : "brightness-100"
              )}
            />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2 xl:gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isInternalRoute = link.internal || link.href.startsWith('/');
              
              if (isInternalRoute) {
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      if (link.href.startsWith('/')) {
                        navigate(link.href);
                      } else {
                        window.location.href = link.href;
                      }
                    }}
                    className={cn(
                      "group flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-md transition-all active:scale-95",
                      (isScrolled || !transparent)
                        ? "hover:bg-emerald-50" 
                        : "hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform flex-shrink-0",
                      (isScrolled || !transparent)
                        ? "bg-emerald-600" 
                        : "bg-white"
                    )}>
                      <Icon className={cn(
                        "w-2.5 h-2.5",
                        (isScrolled || !transparent) ? "text-white" : "text-emerald-600"
                      )} strokeWidth={2.5} />
                    </div>
                    <span className={cn(
                      "font-medium text-[11px] xl:text-xs tracking-wide transition-colors",
                      (isScrolled || !transparent) ? "text-emerald-900" : "text-white"
                    )}>
                      {link.label}
                    </span>
                  </button>
                );
              }
              
              return (
                <a
                  key={link.href}
                  href={link.href}
                  {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                  className={cn(
                    "group flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-md transition-all active:scale-95",
                    (isScrolled || !transparent)
                      ? "hover:bg-emerald-50" 
                      : "hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform flex-shrink-0",
                    (isScrolled || !transparent)
                      ? "bg-emerald-600" 
                      : "bg-white"
                  )}>
                    <Icon className={cn(
                      "w-2.5 h-2.5",
                      (isScrolled || !transparent) ? "text-white" : "text-emerald-600"
                    )} strokeWidth={2.5} />
                  </div>
                  <span className={cn(
                    "font-medium text-[11px] xl:text-xs tracking-wide transition-colors",
                    (isScrolled || !transparent) ? "text-emerald-900" : "text-white"
                  )}>
                    {link.label}
                  </span>
                </a>
              );
            })}
          </nav>

          {/* Auth Buttons / User Area */}
          <div
            className={cn(
              "flex items-center gap-1.5 sm:gap-2",
              user ? "md:ml-4" : "ml-2 sm:ml-4"
            )}
          >
            {user ? (
              // Usuário logado: barra só no desktop; no mobile avatar/Painel/Sair ficam no menu
              <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
                  (isScrolled || !transparent)
                    ? "bg-emerald-50" 
                    : "bg-white/10"
                )}>
                  <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs transition-colors",
                    (isScrolled || !transparent)
                      ? "bg-emerald-600 text-white" 
                      : "bg-white text-emerald-600"
                  )}>
                    {(user?.nome || user?.nome_cli) ? (user.nome || user.nome_cli).charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className={cn(
                    "font-medium text-sm transition-colors",
                    (isScrolled || !transparent) ? "text-emerald-900" : "text-white"
                  )}>
                    {(() => {
                      const fullName = (user?.nome || user?.nome_cli || 'Usuário').trim();
                      const parts = fullName.split(' ');
                      if (parts.length === 1) return parts[0];
                      return `${parts[0]} ${parts[parts.length - 1]}`;
                    })()}
                  </span>
                </div>
                <button
                  onClick={() => navigate("/painel/dashboard")}
                  className={cn(
                    "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-all active:scale-95 whitespace-nowrap",
                    (isScrolled || !transparent)
                      ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                      : "bg-white text-emerald-600 hover:bg-emerald-50"
                  )}
                >
                  Painel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-red-500 text-white rounded-full font-bold text-xs sm:text-sm hover:bg-red-600 transition-all active:scale-95 whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
                  Sair
                </button>
              </div>
            ) : (
              // Usuário não logado
              <>
                <button
                  onClick={handleOpenRegister}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-all active:scale-95 whitespace-nowrap",
                    (isScrolled || !transparent)
                      ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                      : "bg-white text-emerald-600 hover:bg-emerald-50"
                  )}
                >
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Cadastrar</span>
                </button>
                <button
                  onClick={handleOpenLogin}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-all active:scale-95 whitespace-nowrap",
                    isScrolled 
                      ? "bg-emerald-800 text-white hover:bg-emerald-900" 
                      : "bg-emerald-800 text-white hover:bg-emerald-900"
                  )}
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Logar</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={cn("w-6 h-6", (isScrolled || !transparent) ? "text-foreground" : "text-white")} />
            ) : (
              <Menu className={cn("w-6 h-6", (isScrolled || !transparent) ? "text-foreground" : "text-white")} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background shadow-card py-4 px-4 animate-fade-in">
            <nav className="flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isInternalRoute = link.internal || link.href.startsWith('/');
                
                if (isInternalRoute) {
                  return (
                    <button
                      key={link.href}
                      onClick={() => {
                        if (link.href.startsWith('/')) {
                          navigate(link.href);
                        } else {
                          window.location.href = link.href;
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className="group flex items-center gap-2.5 whitespace-nowrap px-3 py-2 rounded-lg transition-all hover:bg-emerald-50 active:scale-[0.99] w-full text-left min-h-[44px]"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                        <Icon className="w-4 h-4 text-white" strokeWidth={2.25} />
                      </div>
                      <span className="text-emerald-900 font-semibold text-sm">
                        {link.label}
                      </span>
                    </button>
                  );
                }
                
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex items-center gap-2.5 whitespace-nowrap px-3 py-2 rounded-lg transition-all hover:bg-emerald-50 active:scale-[0.99] min-h-[44px]"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                      <Icon className="w-4 h-4 text-white" strokeWidth={2.25} />
                    </div>
                    <span className="text-emerald-900 font-semibold text-sm">
                      {link.label}
                    </span>
                  </a>
                );
              })}

              {user && (
                <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-col gap-2">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-50">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold bg-emerald-600 text-white shrink-0">
                      {(user?.nome || user?.nome_cli)
                        ? (user.nome || user.nome_cli).charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <span className="font-medium text-sm text-emerald-900 truncate">
                      {(() => {
                        const fullName = (user?.nome || user?.nome_cli || "Usuário").trim();
                        const parts = fullName.split(" ");
                        if (parts.length === 1) return parts[0];
                        return `${parts[0]} ${parts[parts.length - 1]}`;
                      })()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/painel/dashboard");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center min-h-[44px] px-4 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-[0.99]"
                  >
                    Painel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all active:scale-[0.99]"
                  >
                    <LogOut className="w-4 h-4 shrink-0" strokeWidth={2.25} />
                    Sair
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>

    {/* Auth Modals */}
    <LoginModal
      isOpen={isLoginOpen}
      onClose={() => setIsLoginOpen(false)}
      onSwitchToRegister={handleOpenRegister}
      onSwitchToForgotPassword={handleOpenForgotPassword}
    />
    <RegisterModal
      isOpen={isRegisterOpen}
      onClose={() => setIsRegisterOpen(false)}
      onSwitchToLogin={handleOpenLogin}
    />
    <ForgotPasswordModal
      isOpen={isForgotPasswordOpen}
      onClose={() => setIsForgotPasswordOpen(false)}
    />
  </>
  );
};

export default Header;
