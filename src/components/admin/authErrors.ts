export function errorCopy(code: string): string {
  switch (code) {
    case "invalid_credentials":
      return "Invalid username or password.";
    case "invalid_otp":
      return "Incorrect code. Try again.";
    case "challenge_expired":
    case "challenge_already_used":
      return "Code expired. Start again.";
    case "invalid_challenge":
      return "Session expired. Start again.";
    case "otp_attempts_exceeded":
      return "Too many wrong attempts. Start again.";
    case "otp_resend_cooldown":
      return "Wait before requesting a new code.";
    case "account_disabled":
      return "This admin account is disabled.";
    case "too_many_attempts":
      return "Too many attempts. Wait and retry.";
    case "weak_password":
      return "Password too weak. Use at least 12 characters with letters plus numbers, symbols, or spaces.";
    case "password_unchanged":
      return "New password must be different from the current one.";
    case "invalid_password":
      return "Current password is incorrect.";
    default:
      return "Something went wrong. Try again.";
  }
}
