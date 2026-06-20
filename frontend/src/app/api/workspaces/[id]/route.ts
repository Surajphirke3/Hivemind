import { NextResponse } from "next/server";
import {
  getSessionUserId,
  getWorkspaceById,
} from "@/server/services/workspace.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const workspace = await getWorkspaceById(id);

  if (!workspace || workspace.creator_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(workspace);
}
