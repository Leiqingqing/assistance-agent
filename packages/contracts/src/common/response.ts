import { type BizCode } from "./bizCode";

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  ok: true;
  meta: ApiMeta;
  data: T;
}

export interface ApiError<E> {
  code: BizCode;
  message: string;
  details?: E;
}

export interface ApiFailure<E> {
  ok: false;
  meta: ApiMeta;
  error: ApiError<E>;
}

export type ApiResponse<T, E> = ApiSuccess<T> | ApiFailure<E>;

export const createMeta = (): ApiMeta => ({
  requestId: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
});

export const buildSuccess = <T>(meta: ApiMeta, data: T): ApiSuccess<T> => ({
  ok: true,
  meta,
  data,
});

export const buildFailure = <E>(
  error: ApiError<E>,
  meta: ApiMeta,
): ApiFailure<E> => ({
  ok: false,
  meta,
  error,
});
