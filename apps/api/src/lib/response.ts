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
