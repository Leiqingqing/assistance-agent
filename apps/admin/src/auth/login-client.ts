import { http } from "@/auth/http";
import { AdminPasswordLoginRequest, AdminPasswordLoginResponse } from "@repo/contracts";
import { saveClientSession } from "./client-sessions";

type LoginRequestInput = AdminPasswordLoginRequest;

export async function loginApi(input: LoginRequestInput) {
    const response = await http.post<LoginRequestInput, AdminPasswordLoginResponse>("/auth/admin/password/login", input);
    saveClientSession(response);
}