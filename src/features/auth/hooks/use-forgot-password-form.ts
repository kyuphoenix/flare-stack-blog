import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth/auth.client";
import { sharedAuthErrorMessages } from "@/lib/auth/auth-error-messages";
import { getForgotPasswordAuthErrorMessage } from "@/lib/auth/auth-errors";
import type { Messages } from "@/lib/i18n";
import { auth_error_default_desc } from "@/paraglide/messages";
import { forgot_password_toast_failed } from "@/paraglide/messages";
import { forgot_password_toast_sent } from "@/paraglide/messages";
import { forgot_password_toast_sent_desc } from "@/paraglide/messages";
import { register_validation_email_invalid } from "@/paraglide/messages";

type ForgotPasswordSchemaMessages = Pick<
  Messages,
  "register_validation_email_invalid"
>;

const forgotPasswordSchemaMessages = {
  register_validation_email_invalid,
} satisfies ForgotPasswordSchemaMessages;

const createForgotPasswordSchema = (messages: ForgotPasswordSchemaMessages) =>
  z.object({
    email: z.email(messages.register_validation_email_invalid()),
  });

type ForgotPasswordSchema = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;

export interface UseForgotPasswordFormOptions {
  turnstileToken: string | null;
  turnstilePending: boolean;
  resetTurnstile: () => void;
}

export function useForgotPasswordForm(options: UseForgotPasswordFormOptions) {
  const { turnstileToken, turnstilePending, resetTurnstile } = options;

  const [isSent, setIsSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const forgotPasswordSchema = createForgotPasswordSchema(
    forgotPasswordSchemaMessages,
  );

  const form = useForm<ForgotPasswordSchema>({
    resolver: standardSchemaResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: `${window.location.origin}/reset-link`,
      fetchOptions: {
        headers: { "X-Turnstile-Token": turnstileToken || "" },
      },
    });

    resetTurnstile();

    if (error) {
      toast.error(forgot_password_toast_failed(), {
        description:
          getForgotPasswordAuthErrorMessage(error, sharedAuthErrorMessages) ??
          auth_error_default_desc(),
      });
      return;
    }

    setSentEmail(data.email);
    setIsSent(true);
    toast.success(forgot_password_toast_sent(), {
      description: forgot_password_toast_sent_desc(),
    });
  };

  return {
    register: form.register,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    isSent,
    sentEmail,
    turnstilePending,
  };
}

export type UseForgotPasswordFormReturn = ReturnType<
  typeof useForgotPasswordForm
>;
