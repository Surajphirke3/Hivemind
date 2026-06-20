import { handle } from "hono/vercel";
import { streamApp } from "@/server/routes/stream";

export const GET = handle(streamApp);
