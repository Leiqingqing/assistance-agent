export type StructuredOutputMethod =
  | "jsonSchema"
  | "functionCalling"
  | "jsonMode";

const STRUCTURED_OUTPUT_METHODS: readonly StructuredOutputMethod[] = [
  "jsonSchema",
  "jsonMode",
  "functionCalling",
];

const methodCache = new Map<string, StructuredOutputMethod>();

export async function invokeStructuredOutputWithFallback<T>(options: {
  cacheKey: string;
  operation: string;
  invoke: (method: StructuredOutputMethod) => Promise<T>;
  fallback: T;
}): Promise<T> {
  const scopedCacheKey = `${options.cacheKey}|${options.operation}`;
  const cachedMethod = methodCache.get(scopedCacheKey);
  const methods = cachedMethod
    ? [
        cachedMethod,
        ...STRUCTURED_OUTPUT_METHODS.filter(
          (method) => method !== cachedMethod,
        ),
      ]
    : STRUCTURED_OUTPUT_METHODS;
  let lastError: unknown;

  for (const method of methods) {
    try {
      const result = await options.invoke(method);
      methodCache.set(scopedCacheKey, method);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(
        `${options.operation} structured output method failed: ${method}`,
        error,
      );
    }
  }

  console.error(
    `All ${options.operation} structured output methods failed; using fallback`,
    lastError,
  );
  return options.fallback;
}
