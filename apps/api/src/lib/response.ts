export function buildTextStreamResponse(
  stream: ReadableStream<Uint8Array>,
): Response {
  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-store, no-transform",
      "CDN-Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      Pragma: "no-cache",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function buildImmediateTextStream(
  content: string,
  onComplete: (content: string) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (content) {
          controller.enqueue(encoder.encode(content));
        }
        await onComplete(content);
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
