import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { runAgentsSchema } from "@/lib/zod-schemas";
import { runOrchestration } from "@/server/services/orchestration.service";
import {
  getSessionUserId,
  getWorkspaceById,
} from "@/server/services/workspace.service";

export const agentsApp = new Hono().basePath("/api/agents/run");

agentsApp.post("/", async (c) => {
  const userId = await getSessionUserId();
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = runAgentsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }

  const workspace = await getWorkspaceById(parsed.data.workspaceId);
  if (!workspace || workspace.creator_id !== userId) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  try {
    // Triggers LangGraph loop in the background and returns runId immediately
    await runOrchestration(parsed.data.workspaceId, parsed.data.agentTypes);
    return c.json({ runId: randomUUID() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run agents";
    return c.json({ error: message }, 500);
  }
});
