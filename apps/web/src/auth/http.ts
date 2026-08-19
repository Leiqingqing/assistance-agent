import {
  WebTokenRefreshResponseSchema,
  type WebTokenRefreshResponse,
} from "@repo/contracts/auth";
import { type ApiResponse, BizCode } from "@repo/contracts/common";
import { getApiBaseUrlEnv } from "@env";
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type RawAxiosHeaders,
} from "axios";
import {
  clearClientSession,
  readClientSession,
  saveClientSession,
} from "./client-sessions";

type HttpQueryValue = string | number | boolean;
type HttpQuery = Record<string, HttpQueryValue | null | undefined>;

const WEB_TOKEN_REFRESH_PATH = "/auth/web/token/refresh";
let refreshSessionPromise: Promise<boolean> | null = null;

export type HttpGetOptions = {
  init?: AxiosRequestConfig;
  query?: HttpQuery;
};

export type HttpPostOptions = {
  init?: AxiosRequestConfig;
};

export type HttpMutationOptions = {
  init?: AxiosRequestConfig;
};

function resolveUrl(path: string, query?: HttpQuery): string {
  const value =
    typeof window === "undefined"
      ? process.env.API_BASE_URL
      : process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = new URL(path, getApiBaseUrlEnv(value));

  Object.entries(query ?? {}).forEach(([key, entry]) => {
    if (entry !== undefined && entry !== null) {
      url.searchParams.set(key, String(entry));
    }
  });

  return url.toString();
}

function createRequestConfig(
  path: string,
  config: AxiosRequestConfig,
): AxiosRequestConfig {
  const { params, ...requestConfig } = config;
  const headers = AxiosHeaders.from(
    requestConfig.headers as RawAxiosHeaders | undefined,
  );
  headers.set("accept", "application/json");

  const session = readClientSession();
  if (session !== null && !headers.has("authorization")) {
    headers.set(
      "authorization",
      `${session.tokenType} ${session.accessToken}`,
    );
  }

  return {
    ...requestConfig,
    url: resolveUrl(path, params as HttpQuery | undefined),
    headers,
    validateStatus: () => true,
  };
}

function isWebAuthPath(path: string): boolean {
  try {
    return new URL(path).pathname.startsWith("/auth/web/");
  } catch {
    return path.split(/[?#]/, 1)[0]?.startsWith("/auth/web/") ?? false;
  }
}

function shouldRefreshSession(code: BizCode, path: string): boolean {
  return (
    typeof window !== "undefined" &&
    code === BizCode.AUTH_UNAUTHORIZED &&
    readClientSession() !== null &&
    !isWebAuthPath(path)
  );
}

function unwrapApiResponse<TData>(
  result: ApiResponse<TData>,
  path: string,
): TData {
  if (result.ok) {
    return result.data;
  }

  const error = new Error(result.error.message) as Error & {
    code: BizCode;
    details?: unknown;
    shouldRefresh: boolean;
  };
  error.code = result.error.code;
  error.details = result.error.details;
  error.shouldRefresh = shouldRefreshSession(result.error.code, path);
  throw error;
}

async function performSessionRefresh(): Promise<boolean> {
  const session = readClientSession();
  if (session === null) {
    return false;
  }

  const response = await axios.post<ApiResponse<WebTokenRefreshResponse>>(
    resolveUrl(WEB_TOKEN_REFRESH_PATH),
    { refreshToken: session.refreshToken },
    {
      headers: { accept: "application/json" },
      validateStatus: () => true,
    },
  );
  const result = unwrapApiResponse(response.data, WEB_TOKEN_REFRESH_PATH);
  const refreshedSession = WebTokenRefreshResponseSchema.safeParse(result);

  if (!refreshedSession.success) {
    return false;
  }

  saveClientSession(refreshedSession.data);
  return true;
}

function refreshClientSession(): Promise<boolean> {
  refreshSessionPromise ??= performSessionRefresh().finally(() => {
    refreshSessionPromise = null;
  });
  return refreshSessionPromise;
}

function withCurrentAuthorization(
  config: AxiosRequestConfig,
): AxiosRequestConfig {
  const headers = AxiosHeaders.from(
    config.headers as RawAxiosHeaders | undefined,
  );
  const session = readClientSession();

  if (session !== null) {
    headers.set(
      "authorization",
      `${session.tokenType} ${session.accessToken}`,
    );
  } else {
    headers.delete("authorization");
  }

  return { ...config, headers };
}

async function request<TData>(config: AxiosRequestConfig): Promise<TData> {
  try {
    const response = await axios<ApiResponse<TData>>(config);
    return unwrapApiResponse(response.data, config.url ?? "");
  } catch (caught) {
    const error = caught as Error & { shouldRefresh?: boolean };

    if (error.shouldRefresh) {
      try {
        const refreshed = await refreshClientSession();
        if (!refreshed) {
          throw new Error("Failed to refresh client session");
        }

        const retryConfig = withCurrentAuthorization(config);
        const response = await axios<ApiResponse<TData>>(retryConfig);
        return unwrapApiResponse(response.data, retryConfig.url ?? "");
      } catch (refreshError) {
        clearClientSession();
        throw refreshError;
      }
    }

    if (error instanceof AxiosError) {
      throw new Error(error.message || "Request failed");
    }

    throw error;
  }
}

export const http = {
  get<TData>(path: string, options: HttpGetOptions = {}) {
    return request<TData>(
      createRequestConfig(path, {
        ...options.init,
        method: "GET",
        params: options.query,
      }),
    );
  },

  post<TPayload, TData>(
    path: string,
    payload?: TPayload,
    options?: HttpPostOptions,
  ) {
    return request<TData>(
      createRequestConfig(path, {
        ...options?.init,
        method: "POST",
        data: payload,
      }),
    );
  },

  patch<TPayload, TData>(
    path: string,
    payload: TPayload,
    options?: HttpMutationOptions,
  ) {
    return request<TData>(
      createRequestConfig(path, {
        ...options?.init,
        method: "PATCH",
        data: payload,
      }),
    );
  },

  delete<TData>(path: string, options?: HttpMutationOptions) {
    return request<TData>(
      createRequestConfig(path, {
        ...options?.init,
        method: "DELETE",
      }),
    );
  },
};
