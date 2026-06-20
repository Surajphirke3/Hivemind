import { EventEmitter } from "node:events";
import { Redis } from "@upstash/redis";

// In-memory event emitter for local development
const localEmitter = new EventEmitter();
localEmitter.setMaxListeners(100);

let redis: Redis | null = null;
try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn("Failed to initialize Upstash Redis:", error);
}

export interface StreamEvent {
  event: string;
  data: any;
}

export async function publishEvent(
  workspaceId: string,
  eventType: string,
  data: any,
) {
  const payload: StreamEvent = { event: eventType, data };
  console.log(`[Event Publish] workspace:${workspaceId} -> ${eventType}`, data);

  // 1. Emit locally for active connections on the same server
  localEmitter.emit(`workspace:${workspaceId}`, payload);

  // 2. Publish to Upstash Redis if configured
  if (redis) {
    try {
      const listKey = `workspace:${workspaceId}:events`;
      await redis.rpush(listKey, JSON.stringify(payload));
      await redis.expire(listKey, 3600); // Expire after 1 hour
    } catch (error) {
      console.error("Failed to publish to Upstash Redis:", error);
    }
  }
}

export function getEventStream(workspaceId: string): ReadableStream {
  const encoder = new TextEncoder();
  const listKey = `workspace:${workspaceId}:events`;

  return new ReadableStream({
    async start(controller) {
      let active = true;

      // Send initial keep-alive
      controller.enqueue(encoder.encode("event: open\ndata: {}\n\n"));

      // Local listener callback
      const onEvent = (payload: StreamEvent) => {
        if (!active) return;
        controller.enqueue(
          encoder.encode(
            `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`,
          ),
        );
      };

      // Subscribe to local emitter
      localEmitter.on(`workspace:${workspaceId}`, onEvent);

      // Polling loop for Redis (backup/cross-process)
      const pollRedis = async () => {
        if (!redis) return;
        while (active) {
          try {
            const message = await redis.lpop<any>(listKey);
            if (message) {
              const payload =
                typeof message === "string"
                  ? (JSON.parse(message) as StreamEvent)
                  : (message as StreamEvent);
              controller.enqueue(
                encoder.encode(
                  `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`,
                ),
              );
            } else {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error("Error polling Redis events:", error);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      };

      if (redis) {
        pollRedis();
      }

      // Cleanup
      const cleanup = () => {
        active = false;
        localEmitter.off(`workspace:${workspaceId}`, onEvent);
        try {
          controller.close();
        } catch {
          // Stream might already be closed
        }
      };

      // Handle stream cancellation (client disconnects)
      return cleanup;
    },
  });
}
