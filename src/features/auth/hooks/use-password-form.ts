import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth/auth.client";
import { sharedAuthErrorMessages } from "@/lib/auth/auth-error-messages";
import { getPasswordAuthErrorMessage } from "@/lib/auth/auth-errors";
import type { Messages } from "@/lib/i18n";
import { auth_error_default_desc } from "@/paraglide/messages";
import { profile_toast_password_updated } from "@/paraglide/messages";
import { profile_toast_security_synced } from "@/paraglide/messages";
import { profile_toast_update_failed } from "@/paraglide/messages";
import { profile_validation_current_password_required } from "@/paraglide/messages";
import { profile_validation_new_password_min } from "@/paraglide/messages";
import { profile_validation_password_mismatch } from "@/paraglide/messages";

type PasswordSchemaMessages = Pick<
  Messages,
  | "profile_validation_current_password_required"
  | "profile_validation_new_password_min"
  | "profile_validation_password_mismatch"
>;

const passwordSchemaMessages = {
  profile_validation_current_password_required,
  profile_validation_new_password_min,
  profile_validation_password_mismatch,
} satisfies PasswordSchemaMessages;

const createPasswordSchema = (messages: PasswordSchemaMessages) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, messages.profile_validation_current_password_required()),
      newPassword: z
        .string()
        .min(8, messages.profile_validation_new_password_min()),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: messages.profile_validation_password_mismatch(),
      path: ["confirmPassword"],
    });

type PasswordSchema = z.infer<ReturnType<typeof createPasswordSchema>>;

export function usePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordSchema>({
    resolver: standardSchemaResolver(
      createPasswordSchema(passwordSchemaMessages),
    ),
  });

  const onSubmit = async (data: PasswordSchema) => {
    const { error } = await authClient.changePassword({
      newPassword: data.newPassword,
      currentPassword: data.currentPassword,
      revokeOtherSessions: true,
    });
    if (error) {
      toast.error(profile_toast_update_failed(), {
        description:
          getPasswordAuthErrorMessage(error, sharedAuthErrorMessages) ??
          auth_error_default_desc(),
      });
      return;
    }
    toast.success(profile_toast_password_updated(), {
      description: profile_toast_security_synced(),
    });
    reset();
  };

  return {
    register,
    errors,
    handleSubmit: handleSubmit(onSubmit),
    isSubmitting,
  };
}

export type UsePasswordFormReturn = ReturnType<typeof usePasswordForm>;
