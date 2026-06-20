import { handle } from "hono/vercel";
import { workspacesApp } from "@/server/routes/workspaces";

export const GET = handle(workspacesApp);
export const POST = handle(workspacesApp);
