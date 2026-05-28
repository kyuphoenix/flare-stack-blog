import { useState } from "react";
import { toast } from "sonner";
import { usePreviousLocation } from "@/hooks/use-previous-location";
import { authClient } from "@/lib/auth/auth.client";
import { sharedAuthErrorMessages } from "@/lib/auth/auth-error-messages";
import { getSocialLoginAuthErrorMessage } from "@/lib/auth/auth-errors";
import { auth_error_default_desc } from "@/paraglide/messages";
import { login_toast_social_failed } from "@/paraglide/messages";
import { normalizeRedirectUrl } from "./normalize-redirect-url";

export interface UseSocialLoginOptions {
  redirectTo?: string;
}

export function useSocialLogin(options: UseSocialLoginOptions) {
  const { redirectTo } = options;

  const [isLoading, setIsLoading] = useState(false);
  const previousLocation = usePreviousLocation();
  const callbackURL = normalizeRedirectUrl(redirectTo, previousLocation);

  const handleGithubLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    const { error } = await authClient.signIn.social({
      provider: "github",
      errorCallbackURL: `${window.location.origin}/login`,
      callbackURL,
    });

    if (error) {
      toast.error(login_toast_social_failed(), {
        description:
          getSocialLoginAuthErrorMessage(error, sharedAuthErrorMessages) ??
          auth_error_default_desc(),
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  };

  return {
    isLoading,
    turnstilePending: false,
    handleGithubLogin,
  };
}

export type UseSocialLoginReturn = ReturnType<typeof useSocialLogin>;
