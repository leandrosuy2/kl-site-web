import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";

const STORAGE_KEY = "kl_redirect_after_login";

export function savePendingBookingPath(pathnameWithSearch: string) {
  sessionStorage.setItem(STORAGE_KEY, pathnameWithSearch);
}

/** Após login (a página recarrega), envia o usuário de volta à rota do agendamento. */
export function RedirectAfterLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const target = sessionStorage.getItem(STORAGE_KEY);
    if (target && authService.isAuthenticated()) {
      sessionStorage.removeItem(STORAGE_KEY);
      navigate(target, { replace: true });
    }
  }, [navigate]);

  return null;
}
