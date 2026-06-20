import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceForm } from "@/features/workspace/workspace-form";

export default function NewWorkspacePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">New workspace</h1>
        <p className="text-[var(--color-muted)]">
          Describe the problem. Agents will debate before synthesizing a report.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Problem statement</CardTitle>
          <CardDescription>
            All fields are validated server-side before touching the AI layer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceForm />
        </CardContent>
      </Card>
    </div>
  );
}
