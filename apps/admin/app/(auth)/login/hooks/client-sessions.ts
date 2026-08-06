import {
  AdminPasswordLoginResponseSchema,
  type AdminPasswordLoginResponse,
} from "@repo/contracts";

export const CLIENT_SESSION_STORAGE_KEY = "admin:session";
export const CLIENT_SESSION_CHANGE_EVENT = "admin:session-change-event";

export type ClientSession = AdminPasswordLoginResponse;

let memorySession: ClientSession | null | undefined;

function canUseStorage() {
  return typeof window !== 'undefined'
}

const getLocalStorage = (): Storage | null => {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage;
};

const notifySessionChange = (): void => {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new Event(CLIENT_SESSION_CHANGE_EVENT));
};

export const readClientSession = (): ClientSession | null => {
  if (memorySession !== undefined) {
    return memorySession;
  }

  const storage = getLocalStorage();
  if (storage === null) {
    memorySession = null;
    return memorySession;
  }

  try {
    const storedSession = storage.getItem(CLIENT_SESSION_STORAGE_KEY);
    if (storedSession === null) {
      memorySession = null;
      return memorySession;
    }

    const result = AdminPasswordLoginResponseSchema.safeParse(
      JSON.parse(storedSession),
    );
    memorySession = result.success ? result.data : null;

    if (!result.success) {
      storage.removeItem(CLIENT_SESSION_STORAGE_KEY);
    }
  } catch {
    memorySession = null;
  }

  return memorySession;
};

export const saveClientSession = (session: ClientSession): void => {
  memorySession = session;
  if (!canUseStorage()) {
    return;
  }
  try {
    getLocalStorage()?.setItem(
      CLIENT_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
  } catch {
    // localStorage 可能因隐私设置、容量限制等原因不可写，内存会话仍然可用。
  }

  notifySessionChange();
};

export const clearClientSession = (): void => {
  memorySession = null;

  if(canUseStorage()) {
    try {
      getLocalStorage()?.removeItem(CLIENT_SESSION_STORAGE_KEY);
    } catch {
      // localStorage 可能因隐私设置、容量限制等原因不可用，内存会话仍然可用。
      console.error("Failed to remove client session from localStorage");
    }
  }

  notifySessionChange();
};
