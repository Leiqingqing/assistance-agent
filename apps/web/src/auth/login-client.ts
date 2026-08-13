import type {
  WebPasswordLoginRequest,
  WebPasswordLoginResponse,
} from "@repo/contracts/auth";
import { saveClientSession } from "./client-sessions";
import { http } from "./http";

export async function loginApi(
  input: WebPasswordLoginRequest,
): Promise<WebPasswordLoginResponse> {
  const session = await http.post<
    WebPasswordLoginRequest,
    WebPasswordLoginResponse
  >("/auth/web/password/login", input);
  saveClientSession(session);
  return session;
}
