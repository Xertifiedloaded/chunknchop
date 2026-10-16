
export function getSafeRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}

export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  invalid_state: "Your sign-in session expired. Please try again.",
  invalid_profile: "We couldn't read your Google profile. Please try again.",
  email_not_verified: "Your Google email address isn't verified.",
  token_exchange_failed: "Google sign-in failed. Please try again.",
  google_failed: "Google sign-in failed. Please try again.",
  google_unavailable: "Google sign-in is currently unavailable.",
  too_many_requests: "Too many attempts. Please wait a minute and try again.",
  service_unavailable: "Service is temporarily unavailable. Please try again shortly.",
};