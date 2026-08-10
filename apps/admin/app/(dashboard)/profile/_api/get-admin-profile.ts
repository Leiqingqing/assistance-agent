export type AdminStatus = "active" | "disabled";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: AdminStatus;
  department: string;
  phone: string;
  lastLoginAt: string;
  createdAt: string;
}

const MOCK_ADMIN_PROFILE: AdminProfile = {
  id: "admin_01",
  name: "系统管理员",
  email: "admin@example.com",
  role: "超级管理员",
  status: "active",
  department: "平台运营中心",
  phone: "138****8888",
  lastLoginAt: "2026-08-07T07:32:00.000Z",
  createdAt: "2025-01-15T02:00:00.000Z",
};

/**
 * 临时的管理员资料接口。
 * 后端接口就绪后，保留函数签名并将 mock 替换为真实请求即可。
 */
export async function getAdminProfile(): Promise<AdminProfile> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return { ...MOCK_ADMIN_PROFILE };
}
