import {
  WebPasswordLoginResponseSchema,
  type WebPasswordLoginResponse,
} from "@repo/contracts/auth";

export const CLIENT_SESSION_STORAGE_KEY = "web:session";
export const CLIENT_SESSION_CHANGE_EVENT = "web:session-change-event";

export type ClientSession = WebPasswordLoginResponse;

let memorySession: ClientSession | null | undefined;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function getLocalStorage(): Storage | null {
  return canUseStorage() ? window.localStorage : null;
}

function notifySessionChange(): void {
  if (canUseStorage()) {
    window.dispatchEvent(new Event(CLIENT_SESSION_CHANGE_EVENT));
  }
}

export function readClientSession(): ClientSession | null {
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

    const result = WebPasswordLoginResponseSchema.safeParse(
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
}

export function saveClientSession(session: ClientSession): void {
  memorySession = session;

  try {
    getLocalStorage()?.setItem(
      CLIENT_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
  } catch {
    // Storage may be unavailable; the in-memory session remains usable.
  }

  notifySessionChange();
}

export function clearClientSession(): void {
  memorySession = null;

  try {
    getLocalStorage()?.removeItem(CLIENT_SESSION_STORAGE_KEY);
  } catch {
    // Storage may be unavailable; the in-memory session has still been cleared.
  }

  notifySessionChange();
}
