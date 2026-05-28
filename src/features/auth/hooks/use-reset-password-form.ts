import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AUTH_KEYS } from "@/features/auth/queries";
import { authClient } from "@/lib/auth/auth.client";
import { resetPasswordAuthErrorMessages } from "@/lib/auth/auth-error-messages";
import { getResetPasswordAuthErrorMessage } from "@/lib/auth/auth-errors";
import type { Messages } from "@/lib/i18n";
import { register_validation_password_min } from "@/paraglide/messages";
import { register_validation_password_mismatch } from "@/paraglide/messages";
import { reset_password_toast_failed } from "@/paraglide/messages";
import { reset_password_toast_failed_desc } from "@/paraglide/messages";
import { reset_password_toast_missing_token } from "@/paraglide/messages";
import { reset_password_toast_success } from "@/paraglide/messages";
import { reset_password_toast_success_desc } from "@/paraglide/messages";

type ResetPasswordSchemaMessages = Pick<
  Messages,
  "register_validation_password_min" | "register_validation_password_mismatch"
>;

const resetPasswordSchemaMessages = {
  register_validation_password_min,
  register_validation_password_mismatch,
} satisfies ResetPasswordSchemaMessages;

const createResetPasswordSchema = (messages: ResetPasswordSchemaMessages) =>
  z
    .object({
      password: z.string().min(8, messages.register_validation_password_min()),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.register_validation_password_mismatch(),
      path: ["confirmPassword"],
    });

type ResetPasswordSchema = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;

export interface UseResetPasswordFormOptions {
  token: string | undefined;
}

export function useResetPasswordForm(options: UseResetPasswordFormOptions) {
  const { token } = options;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resetPasswordSchema = createResetPasswordSchema(
    resetPasswordSchemaMessages,
  );

  const form = useForm<ResetPasswordSchema>({
    resolver: standardSchemaResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordSchema) => {
    if (!token) {
      toast.error(reset_password_toast_missing_token());
      return;
    }

    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });

    if (error) {
      toast.error(reset_password_toast_failed(), {
        description:
          getResetPasswordAuthErrorMessage(
            error,
            resetPasswordAuthErrorMessages,
          ) ?? reset_password_toast_failed_desc(),
      });
      return;
    }

    queryClient.removeQueries({ queryKey: AUTH_KEYS.session });

    toast.success(reset_password_toast_success(), {
      description: reset_password_toast_success_desc(),
    });
    navigate({ to: "/login" });
  };

  return {
    register: form.register,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  };
}

export type UseResetPasswordFormReturn = ReturnType<
  typeof useResetPasswordForm
>;
