import { handle } from "hono/vercel";
import { agentsApp } from "@/server/routes/agents";

export const POST = handle(agentsApp);
