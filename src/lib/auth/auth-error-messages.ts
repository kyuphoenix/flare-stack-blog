import { auth_error_credential_not_found } from "@/paraglide/messages";
import { auth_error_invalid_password } from "@/paraglide/messages";
import { auth_error_invalid_token } from "@/paraglide/messages";
import { auth_error_session_expired } from "@/paraglide/messages";
import { auth_error_user_already_exists } from "@/paraglide/messages";
import { auth_error_user_not_found } from "@/paraglide/messages";
import { login_error_email_not_verified } from "@/paraglide/messages";
import { login_error_invalid_credentials } from "@/paraglide/messages";
import { request_error_rate_limited_desc } from "@/paraglide/messages";
import { reset_password_toast_failed_desc } from "@/paraglide/messages";
import { turnstile_error_failed_desc } from "@/paraglide/messages";
import type {
  LoginAuthErrorMessages,
  ResetPasswordAuthErrorMessages,
  SharedAuthErrorMessages,
} from "./auth-errors";

export const sharedAuthErrorMessages = {
  auth_error_credential_not_found,
  auth_error_invalid_password,
  auth_error_invalid_token,
  auth_error_session_expired,
  auth_error_user_already_exists,
  auth_error_user_not_found,
  request_error_rate_limited_desc,
  turnstile_error_failed_desc,
} satisfies SharedAuthErrorMessages;

export const loginAuthErrorMessages = {
  ...sharedAuthErrorMessages,
  login_error_email_not_verified,
  login_error_invalid_credentials,
} satisfies LoginAuthErrorMessages;

export const resetPasswordAuthErrorMessages = {
  ...sharedAuthErrorMessages,
  reset_password_toast_failed_desc,
} satisfies ResetPasswordAuthErrorMessages;
