interface SetRefreshTokenCookieOptions {
  value: string;
  maxAge: number;
  path: "/auth/web" | "/auth/admin";
}

export const setRefreshTokenCookie = (
  headers: Headers,
  options: SetRefreshTokenCookieOptions,
) => {
  headers.append(
    "Set-Cookie",
    `refresh_token=${options.value}; HttpOnly; Secure; SameSite=Lax; Path=${options.path}; Max-Age=${options.maxAge}`,
  );
};

export const clearAdminRefreshTokenCookie = (headers: Headers) => {
  setRefreshTokenCookie(headers, {
    value: "",
    maxAge: 0,
    path: "/auth/admin",
  });
};