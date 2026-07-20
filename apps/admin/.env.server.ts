import { getApiBaseUrlEnv, getAppEnv } from "@env";

export function getServerAppEnv() {
  return getAppEnv(process.env.APP_ENV);
}

export function getServerApiBaseUrl() {
  return getApiBaseUrlEnv(process.env.API_BASE_URL);
}
