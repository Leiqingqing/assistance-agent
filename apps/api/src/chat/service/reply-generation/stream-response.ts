function getSseData(event: string): string | undefined {
  const dataLines = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => {
      const value = line.slice("data:".length);
      return value.startsWith(" ") ? value.slice(1) : value;
    });

  return dataLines.length > 0 ? dataLines.join("\n") : undefined;
}

function extractDeltaContent(event: string): string {
  const data = getSseData(event);

  if (!data || data === "[DONE]") {
    return "";
  }

  const payload = JSON.parse(data) as {
    choices?: Array<{ delta?: { content?: unknown } }>;
    error?: { message?: string };
  };

  if (payload.error) {
    throw new Error(
      payload.error.message ?? "Upstream completion stream failed",
    );
  }

  const content = payload.choices?.[0]?.delta?.content;
  return typeof content === "string" ? content : "";
}

export function sseToTextReadableStream(
  source: ReadableStream<Uint8Array>,
  onComplete: (content: string) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = source.getReader();
  let buffer = "";
  let completeContent = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });

          if (done) {
            if (buffer.trim()) {
              const text = extractDeltaContent(buffer);
              if (text) {
                completeContent += text;
                controller.enqueue(encoder.encode(text));
              }
            }
            if (completeContent.trim()) {
              await onComplete(completeContent);
            }
            controller.close();
            return;
          }

          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";

          for (const event of events) {
            const text = extractDeltaContent(event);
            if (text) {
              completeContent += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        }
      } catch (error) {
        console.error("Inbox chat stream failed", error);
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
    async cancel(reason) {
      await reader.cancel(reason);
    },
  });
}
