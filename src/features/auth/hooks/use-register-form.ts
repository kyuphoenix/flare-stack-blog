import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AUTH_KEYS } from "@/features/auth/queries";
import { usePreviousLocation } from "@/hooks/use-previous-location";
import { authClient } from "@/lib/auth/auth.client";
import { sharedAuthErrorMessages } from "@/lib/auth/auth-error-messages";
import { getRegisterAuthErrorMessage } from "@/lib/auth/auth-errors";
import type { Messages } from "@/lib/i18n";
import { register_error_default } from "@/paraglide/messages";
import { register_toast_activated } from "@/paraglide/messages";
import { register_toast_created } from "@/paraglide/messages";
import { register_toast_failed } from "@/paraglide/messages";
import { register_toast_success } from "@/paraglide/messages";
import { register_toast_verification_sent } from "@/paraglide/messages";
import { register_validation_email_invalid } from "@/paraglide/messages";
import { register_validation_name_max } from "@/paraglide/messages";
import { register_validation_name_min } from "@/paraglide/messages";
import { register_validation_password_min } from "@/paraglide/messages";
import { register_validation_password_mismatch } from "@/paraglide/messages";

type RegisterSchemaMessages = Pick<
  Messages,
  | "register_validation_email_invalid"
  | "register_validation_name_max"
  | "register_validation_name_min"
  | "register_validation_password_min"
  | "register_validation_password_mismatch"
>;

const registerSchemaMessages = {
  register_validation_email_invalid,
  register_validation_name_max,
  register_validation_name_min,
  register_validation_password_min,
  register_validation_password_mismatch,
} satisfies RegisterSchemaMessages;

const createRegisterSchema = (messages: RegisterSchemaMessages) =>
  z
    .object({
      name: z
        .string()
        .min(2, messages.register_validation_name_min())
        .max(20, messages.register_validation_name_max()),
      email: z.email(messages.register_validation_email_invalid()),
      password: z.string().min(8, messages.register_validation_password_min()),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.register_validation_password_mismatch(),
      path: ["confirmPassword"],
    });

type RegisterSchema = z.infer<ReturnType<typeof createRegisterSchema>>;

export interface UseRegisterFormOptions {
  turnstileToken: string | null;
  turnstilePending: boolean;
  resetTurnstile: () => void;
  isEmailConfigured: boolean;
}

export function useRegisterForm(options: UseRegisterFormOptions) {
  const {
    turnstileToken,
    turnstilePending,
    resetTurnstile,
    isEmailConfigured,
  } = options;

  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const previousLocation = usePreviousLocation();
  const queryClient = useQueryClient();
  const registerSchema = createRegisterSchema(registerSchemaMessages);

  const form = useForm<RegisterSchema>({
    resolver: standardSchemaResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      callbackURL: `${window.location.origin}/verify-email`,
      fetchOptions: {
        headers: { "X-Turnstile-Token": turnstileToken || "" },
      },
    });

    resetTurnstile();

    if (error) {
      toast.error(register_toast_failed(), {
        description:
          getRegisterAuthErrorMessage(error, sharedAuthErrorMessages) ??
          register_error_default(),
      });
      return;
    }

    queryClient.removeQueries({ queryKey: AUTH_KEYS.session });

    if (isEmailConfigured) {
      setIsSuccess(true);
      toast.success(register_toast_created(), {
        description: register_toast_verification_sent(),
      });
    } else {
      toast.success(register_toast_success(), {
        description: register_toast_activated(),
      });
      navigate({ to: previousLocation });
    }
  };

  return {
    register: form.register,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    isSuccess,
    turnstilePending,
  };
}

export type UseRegisterFormReturn = ReturnType<typeof useRegisterForm>;
