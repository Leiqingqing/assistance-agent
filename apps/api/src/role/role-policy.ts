export const PROTECTED_ROLE_CODES = ["admin_owner", "web_user"] as const;

export function isProtectedRoleCode(code: string): boolean {
  return (PROTECTED_ROLE_CODES as readonly string[]).includes(code);
}
