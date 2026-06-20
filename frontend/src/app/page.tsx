import Link from "next/link";
import { AgentCard } from "@/components/agent-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-6 py-8">
        <p className="text-sm uppercase tracking-widest text-[var(--color-accent)]">
          Monad Blitz · Collective Intelligence
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Multiple AI experts. Visible disagreement. Verifiable provenance.
        </h1>
        <p className="max-w-2xl text-lg text-[var(--color-muted)]">
          HiveMind Protocol runs Research, Market, Risk, and Technical agents in
          parallel, challenges their claims with a Critic, and synthesizes a
          final report — anchored to Monad for auditability.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/workspace/new">Start a workspace</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">View dashboard</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Parallel reasoning",
            body: "Four specialized agents analyze your problem concurrently — not one model guessing twice.",
          },
          {
            title: "Transparent consensus",
            body: "A Critic agent challenges weak claims before the Synthesizer resolves conflicts.",
          },
          {
            title: "On-chain provenance",
            body: "Contribution hashes land on Monad — the chain is the receipt, not the database.",
          },
        ].map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-muted)]">
                {feature.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Preview: agent cards</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Static Phase 1 components — wired to SSE in Phase 2.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <AgentCard
            agentRole="research"
            status="running"
            summary="Mapping regulatory landscape for AI startups in India..."
          />
          <AgentCard
            agentRole="market"
            status="done"
            summary="TAM estimate ₹12B for vertical SaaS; top competitors listed."
            score={85}
          />
        </div>
      </section>
    </div>
  );
}
