import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createServiceRoleClient } from "@/lib/supabase";
import { workspaceRegistryAddress } from "@/server/contracts/addresses";
import {
  getSessionUserId,
  getWorkspaceById,
} from "@/server/services/workspace.service";
import type { Report } from "@/types/database";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const userId = await getSessionUserId();
  const workspace = await getWorkspaceById(id);

  if (!workspace || (userId && workspace.creator_id !== userId)) {
    notFound();
  }

  const supabase = createServiceRoleClient();
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("workspace_id", id)
    .maybeSingle();

  const typedReport = report as Report | null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Workspace Report</h1>
          <p className="text-[var(--color-muted)]">{workspace.title}</p>
        </div>
        <Badge variant={typedReport ? "success" : "secondary"}>
          {typedReport ? "Finalized" : "Pending Synthesis"}
        </Badge>
      </div>

      {!typedReport ? (
        <Card>
          <CardHeader>
            <CardTitle>Report not generated yet</CardTitle>
            <CardDescription>
              The Synthesizer agent will generate the report after all committee
              members complete their runs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--color-muted)]">
              Please go back to the workspace details page and spawn the agent
              committee to complete the analysis.
            </p>
            <Button asChild>
              <Link href={`/workspace/${workspace.id}`}>Back to workspace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-[var(--color-foreground)]">
              {typedReport.executive_summary}
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader>
              <CardTitle>Key Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--color-foreground)]">
                {((typedReport.key_findings as any) || []).map(
                  (finding: string) => (
                    <li key={finding}>{finding}</li>
                  ),
                )}
              </ul>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-[var(--color-border)] bg-[var(--color-surface)] border-l-4 border-l-[var(--color-danger)]">
              <CardHeader>
                <CardTitle className="text-[var(--color-danger)]">
                  Critical Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--color-foreground)]">
                  {((typedReport.risks as any) || []).map((risk: string) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border)] bg-[var(--color-surface)] border-l-4 border-l-[var(--color-success)]">
              <CardHeader>
                <CardTitle className="text-[var(--color-success)]">
                  Actionable Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--color-foreground)]">
                  {((typedReport.recommendations as any) || []).map(
                    (rec: string) => (
                      <li key={rec}>{rec}</li>
                    ),
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {workspace.content_hash && (
            <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-[var(--color-accent)]">
                  On-Chain Provenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 bg-[var(--color-bg)]">
                  <span className="block text-xs text-[var(--color-muted)] font-mono">
                    Report Hash (Keccak256)
                  </span>
                  <span className="block break-all text-xs font-mono text-[var(--color-foreground)]">
                    {workspace.content_hash}
                  </span>
                </div>
                {workspaceRegistryAddress ? (
                  <Button
                    variant="outline"
                    asChild
                    size="sm"
                    className="font-mono text-xs"
                  >
                    <a
                      href={`https://testnet.monadexplorer.com/address/${workspaceRegistryAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Verify Contract on Monad Testnet Explorer
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-[var(--color-muted)]">
                    Verified in local registry.
                  </span>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button variant="secondary" asChild>
              <Link href={`/workspace/${workspace.id}`}>Back to workspace</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
