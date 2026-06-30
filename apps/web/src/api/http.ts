import { ApiResponse, BizCode } from "@repo/contracts/common";
import { getApiBaseUrlEnv } from "../../.env";

type HttpMethod = "GET" | "POST";
type HttpQueryValue = string | number | boolean;
type HttpQuery = Record<string, HttpQueryValue | null>;

export type HttpGetOptions = {
  init?: RequestInit;
  query?: HttpQuery;
};
export type HttpPostOptions = {
  init?: RequestInit;
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

// 处理params、处理header、拼接url、post body 序列化、处理异常response
async function request<TData, TError = unknown>(
  method: HttpMethod,
  path: string,
  options: {
    init?: RequestInit;
    query?: HttpQuery;
    payload?: unknown;
  },
): Promise<ApiResponse<TData, TError>> {
  try {
    const headers = new Headers(options.init?.headers);
    headers.set("accept", "application/json");

    if (method === "POST" && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(resolveUrl(path, options.query), {
      ...options.init,
      method,
      headers,
      body:
        options.payload === undefined
          ? undefined
          : JSON.stringify(options.payload),
    });

    return response.json();
  } catch (e) {
    const message = e instanceof Error ? e.message : "API request failed";

    return {
      ok: false,
      meta: {
        requestId: "unavailable",
        timestamp: new Date().toISOString(),
      },
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message,
        details: {
          reason: message,
        } as TError,
      },
    };
  }
}

export const http = {
  get<TData, TError = unknown>(path: string, options: HttpGetOptions = {}) {
    return request<TData, TError>("GET", path, {
      init: options.init,
      query: options.query,
    });
  },
  post<TQuery, TData, TError = unknown>(
    path: string,
    payload?: TQuery,
    options?: HttpPostOptions,
  ) {
    return request<TData, TError>("POST", path, {
      payload,
      init: options?.init,
    });
  },
};
