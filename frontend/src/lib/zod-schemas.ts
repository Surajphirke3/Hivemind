import { z } from "zod";

const sanitizedText = z
  .string()
  .trim()
  .min(1, "Required")
  .max(2000, "Must be 2000 characters or fewer")
  .refine((val) => !/[<>{}]/.test(val), "Invalid characters detected");

export const createWorkspaceSchema = z.object({
  title: sanitizedText.max(200, "Title must be 200 characters or fewer"),
  problemStatement: sanitizedText,
  goal: sanitizedText.max(500, "Goal must be 500 characters or fewer"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const runAgentsSchema = z.object({
  workspaceId: z.string().uuid(),
  agentTypes: z
    .array(z.enum(["research", "market", "risk", "technical"]))
    .min(1)
    .max(4),
});

export type RunAgentsInput = z.infer<typeof runAgentsSchema>;
