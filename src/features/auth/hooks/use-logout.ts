import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AUTH_KEYS } from "@/features/auth/queries";
import { authClient } from "@/lib/auth/auth.client";
import { sharedAuthErrorMessages } from "@/lib/auth/auth-error-messages";
import { getLogoutAuthErrorMessage } from "@/lib/auth/auth-errors";
import { auth_logout_failed } from "@/paraglide/messages";
import { auth_logout_failed_desc } from "@/paraglide/messages";
import { auth_logout_success } from "@/paraglide/messages";
import { auth_logout_success_desc } from "@/paraglide/messages";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(auth_logout_failed(), {
        description:
          getLogoutAuthErrorMessage(error, sharedAuthErrorMessages) ??
          auth_logout_failed_desc(),
      });
      return;
    }
    queryClient.removeQueries({ queryKey: AUTH_KEYS.session });
    toast.success(auth_logout_success(), {
      description: auth_logout_success_desc(),
    });
    navigate({ to: "/" });
  };

  return { logout };
}
