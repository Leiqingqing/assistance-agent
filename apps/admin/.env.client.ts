import { getApiBaseUrlEnv, getAppEnv } from "./.env";

export function getClientAppEnv() {
  return getAppEnv(process.env.NEXT_PUBLIC_APP_ENV);
}

export function getClientApiBaseUrl() {
  return getApiBaseUrlEnv(process.env.NEXT_PUBLIC_API_BASE_URL);
}
