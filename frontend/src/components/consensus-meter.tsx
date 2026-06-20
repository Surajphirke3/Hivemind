import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ConsensusMeterProps {
  scores?: number[];
  className?: string;
}

export function ConsensusMeter({ scores, className }: ConsensusMeterProps) {
  const values = scores ?? [72, 85, 68, 91];
  const average = Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (average / 100) * circumference;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Consensus</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative h-32 w-32">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 120 120"
            role="img"
            aria-label={`Consensus score ${average} out of 100`}
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold">{average}</span>
            <span className="text-xs text-[var(--color-muted)]">/ 100</span>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 text-xs text-[var(--color-muted)]">
          {["Research", "Market", "Risk", "Technical"].map((label, index) => (
            <div
              key={label}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-center font-mono"
            >
              {label}: {values[index] ?? 0}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
