import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getEventStream } from "@/server/services/event.service";

export const streamApp = new Hono().basePath("/api/stream");

streamApp.get("/:id", async (c) => {
  const workspaceId = c.req.param("id");

  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");

  return streamSSE(c, async (stream) => {
    const readable = getEventStream(workspaceId);
    const reader = readable.getReader();

    stream.onAbort(() => {
      reader.cancel();
    });

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        await stream.write(value);
      }
    } catch (error) {
      console.error("Hono SSE route error:", error);
    } finally {
      reader.releaseLock();
    }
  });
});
