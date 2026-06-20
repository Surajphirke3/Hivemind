import { Hono } from "hono";
import { createWorkspaceSchema } from "@/lib/zod-schemas";
import { rateLimit } from "@/server/services/rate-limit.service";
import {
  createWorkspace,
  getSessionUserId,
  getSessionWalletAddress,
  listWorkspacesByCreator,
} from "@/server/services/workspace.service";

export const workspacesApp = new Hono().basePath("/api/workspaces");

workspacesApp.get("/", async (c) => {
  const userId = await getSessionUserId();
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const workspaces = await listWorkspacesByCreator(userId);
    return c.json(workspaces);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list workspaces";
    return c.json({ error: message }, 500);
  }
});

workspacesApp.post("/", async (c) => {
  const userId = await getSessionUserId();
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check rate limit by wallet address
  const walletAddress = await getSessionWalletAddress();
  if (walletAddress) {
    const limitResult = await rateLimit(walletAddress);
    if (!limitResult.allowed) {
      const retryAfter = limitResult.reset - Math.floor(Date.now() / 1000);
      return c.json(
        {
          error: "Rate limit exceeded",
          message: `Too many workspaces created. Please try again after ${Math.ceil(retryAfter / 60)} minutes.`,
        },
        429,
      );
    }
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }

  try {
    const workspace = await createWorkspace(parsed.data, userId);
    return c.json({ workspaceId: workspace.id }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create workspace";
    return c.json({ error: message }, 500);
  }
});
