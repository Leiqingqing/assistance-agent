import { type BizCode } from "./bizCode";

export type AppErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500 | 504;

export class AppError<E> extends Error {
  constructor(
    readonly code: BizCode,
    message: string,
    readonly status: AppErrorStatus,
    readonly details?: E,
  ) {
    super(message);
    this.name = "AppError";
  }
}
