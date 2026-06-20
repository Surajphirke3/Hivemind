import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkspaceStatus } from "@/types/database";

const statusVariant: Record<
  WorkspaceStatus,
  "default" | "secondary" | "success" | "warning"
> = {
  pending: "secondary",
  running: "default",
  finalized: "success",
};

export interface WorkspaceCardProps {
  id: string;
  title: string;
  status: WorkspaceStatus;
  createdAt: string;
}

export function WorkspaceCard({
  id,
  title,
  status,
  createdAt,
}: WorkspaceCardProps) {
  return (
    <Link href={`/workspace/${id}`}>
      <Card className="transition-shadow hover:shadow-md hover:border-[var(--color-accent)]/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1">{title}</CardTitle>
            <Badge variant={statusVariant[status]}>{status}</Badge>
          </div>
          <CardDescription>
            Created {new Date(createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted)]">
            Open workspace to view agent activity and reports.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
