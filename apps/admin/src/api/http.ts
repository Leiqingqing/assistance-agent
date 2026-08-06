import {
  AdminTokenRefleshResponseSchema,
  type AdminTokenRefleshResponse,
} from "@repo/contracts/auth";
import { ApiResponse, BizCode } from "@repo/contracts/common";
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
} from "@app/(auth)/login/hooks/client-sessions";

type HttpMethod = "GET" | "POST";
type HttpQueryValue = string | number | boolean;
type HttpQuery = Record<string, HttpQueryValue | null>;
type HttpRequestOptions = {
  init?: AxiosRequestConfig;
  query?: HttpQuery;
  payload?: unknown;
};

const ADMIN_TOKEN_REFRESH_PATH = "/auth/admin/token/refresh";
const ADMIN_TOKEN_REFRESH_PATH_SUFFIX = "/admin/token/refresh";
// 存储刷新会话的 promise，避免重复刷新
let refreshSessionPromise: Promise<boolean> | null = null;

export type HttpGetOptions = {
  init?: AxiosRequestConfig;
  query?: HttpQuery;
};
export type HttpPostOptions = {
  init?: AxiosRequestConfig;
};

function resolveUrl(path: string, query?: HttpQuery) {
  const value =
    typeof window === "undefined"
      ? process.env.API_BASE_URL
      : process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = new URL(path, getApiBaseUrlEnv(value));

  if (query) {
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, entry]) => {
      if (Array.isArray(entry)) {
        entry.forEach((value) => {
          searchParams.append(key, String(value));
        });
        return;
      }

      if (entry !== undefined && entry !== null) {
        searchParams.set(key, String(entry));
      }
    });

    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}

function createRequestConfig(
  method: HttpMethod,
  options: HttpRequestOptions,
): AxiosRequestConfig {
  const headers = AxiosHeaders.from(
    options.init?.headers as RawAxiosHeaders | undefined,
  );
  headers.set("accept", "application/json");

  const session = readClientSession();
  if (session !== null && !headers.has("authorization")) {
    headers.set(
      "authorization",
      `${session.tokenType} ${session.accessToken}`,
    );
  }

  const config: AxiosRequestConfig = {
    ...options.init,
    method,
    headers,
    validateStatus: () => true,
  };

  if (options.payload !== undefined) {
    config.data = options.payload;
  }

  return config;
}

function isTokenRefreshPath(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0]?.replace(/\/+$/, "");
  return pathname?.endsWith(ADMIN_TOKEN_REFRESH_PATH_SUFFIX) ?? false;
}

function shouldRefreshSession(code: BizCode, path: string): boolean {
  return (
    typeof window !== "undefined" &&
    code === BizCode.AUTH_UNAUTHORIZED &&
    !isTokenRefreshPath(path)
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
    shouldRefreshed: boolean;
  };

  error.code = result.error.code;
  error.shouldRefreshed = shouldRefreshSession(result.error.code, path);
  throw error;
}

async function performSessionRefresh(): Promise<boolean> {
  const session = readClientSession();
  if (session === null) {
    throw new Error("Failed to refresh session");
  }

  const response = await axios.post<ApiResponse<AdminTokenRefleshResponse>>(
    resolveUrl(ADMIN_TOKEN_REFRESH_PATH),
    { refreshToken: session.refreshToken },
    {
      headers: {
        accept: "application/json",
      },
      validateStatus: () => true,
    },
  );

  const result = unwrapApiResponse(
    response.data,
    ADMIN_TOKEN_REFRESH_PATH,
  );

  const refreshedSession =
    AdminTokenRefleshResponseSchema.safeParse(result);

  if (refreshedSession.success) {
    saveClientSession(refreshedSession.data);
    return true;
  }
  return false;
}

function refreshClientSession(): Promise<boolean> {
  if(!refreshSessionPromise) {
    refreshSessionPromise = performSessionRefresh().finally(() => {
      refreshSessionPromise = null;
    });
  }
  
  return refreshSessionPromise;
}

async function request<TData>(
  method: HttpMethod,
  path: string,
  options: HttpRequestOptions,
): Promise<TData> {
  try {
    const response = await axios<ApiResponse<TData>>(
      resolveUrl(path, options.query),
      createRequestConfig(method, options),
    );

    return unwrapApiResponse(response.data, path);
  } catch (e) {
    const error = e as Error & { shouldRefreshed?: boolean };
    if (error.shouldRefreshed ) {
      try {
        await refreshClientSession()
        const response = await axios<ApiResponse<TData>>(
          resolveUrl(path, options.query),
          createRequestConfig(method, options),
        );
        return unwrapApiResponse(response.data, path);
      } catch (e) {
        clearClientSession()
        throw new Error((e as Error)?.message||"Failed to refresh client session");
      }
    } 
    
    // 判断一下error是否是AxiosError，收敛漏网之鱼，防止其他地方抛出其他错误
    if (error instanceof AxiosError) {
      throw new Error(error.message || 'Request failed')
    }

    throw error
  }
}

export const http = {
  get<TData>(path: string, options: HttpGetOptions = {}) {
    return request<TData>("GET", path, {
      init: options.init,
      query: options.query,
    });
  },
  post<TQuery, TData>(
    path: string,
    payload?: TQuery,
    options?: HttpPostOptions,
  ) {
    return request<TData>("POST", path, { payload, init: options?.init });
  },
};
