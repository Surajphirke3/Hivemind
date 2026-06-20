import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceCard } from "@/components/workspace-card";
import {
  getSessionUserId,
  listWorkspacesByCreator,
} from "@/server/services/workspace.service";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  let workspaces: Awaited<ReturnType<typeof listWorkspacesByCreator>> = [];

  if (userId) {
    try {
      workspaces = await listWorkspacesByCreator(userId);
    } catch {
      workspaces = [];
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-[var(--color-muted)]">
            Your collective intelligence workspaces.
          </p>
        </div>
        <Button asChild>
          <Link href="/workspace/new">New workspace</Link>
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No workspaces yet</CardTitle>
            <CardDescription>
              Connect your wallet, then create your first workspace to spawn the
              agent committee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/workspace/new">Create your first workspace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              id={workspace.id}
              title={workspace.title}
              status={workspace.status}
              createdAt={workspace.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
