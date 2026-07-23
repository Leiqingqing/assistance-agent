const SALT_LENGTH = 16;

export async function hash256(
  value: string | Uint8Array,
): Promise<Uint8Array> {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);

  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await hash256(value);

  return Array.from(digest, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function splitPasswordHash(
  value: string,
): { salt: Uint8Array; passwordHash: Uint8Array } | null {
  const [encodedSalt, encodedPasswordHash, extraPart] = value.split("$");

  if (
    !encodedSalt ||
    !encodedPasswordHash ||
    extraPart !== undefined
  ) {
    return null;
  }

  try {
    const salt = Uint8Array.from(atob(encodedSalt), (character) =>
      character.charCodeAt(0),
    );
    const passwordHash = Uint8Array.from(
      atob(encodedPasswordHash),
      (character) => character.charCodeAt(0),
    );

    return { salt, passwordHash };
  } catch {
    return null;
  }
}

async function hashPasswordWithSalt(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  const input = new Uint8Array(passwordBytes.length + salt.length);

  input.set(passwordBytes);
  input.set(salt, passwordBytes.length);

  return hash256(input);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const digest = await hashPasswordWithSalt(password, salt);
  const encodedSalt = btoa(String.fromCharCode(...salt));
  const encodedDigest = btoa(String.fromCharCode(...digest));

  return `${encodedSalt}$${encodedDigest}`;
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const stored = splitPasswordHash(passwordHash);

  if (stored === null) {
    return false;
  }

  const actualHash = await hashPasswordWithSalt(password, stored.salt);

  if (actualHash.length !== stored.passwordHash.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < actualHash.length; index += 1) {
    difference |= actualHash[index]! ^ stored.passwordHash[index]!;
  }

  return difference === 0;
}
