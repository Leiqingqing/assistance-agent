export function mergeConversationMetadata(
  existingMetadataJson: string | null | undefined,
  newMetadata: Readonly<Record<string, unknown>>,
): string {
  let existingMetadata: Record<string, unknown> = {};

  if (existingMetadataJson) {
    const parsedMetadata: unknown = JSON.parse(existingMetadataJson);

    if (
      typeof parsedMetadata !== "object" ||
      parsedMetadata === null ||
      Array.isArray(parsedMetadata)
    ) {
      throw new TypeError("Conversation metadata must be a JSON object");
    }

    existingMetadata = parsedMetadata as Record<string, unknown>;
  }

  return JSON.stringify({
    ...existingMetadata,
    ...newMetadata,
  });
}
