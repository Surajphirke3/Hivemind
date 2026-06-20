import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase";
import type { CreateWorkspaceInput } from "@/lib/zod-schemas";
import type { User, Workspace } from "@/types/database";

const SESSION_COOKIE = "hivemind_user_id";
const WALLET_COOKIE = "hivemind_wallet_address";

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionWalletAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(WALLET_COOKIE)?.value ?? null;
}

export async function upsertUserByWallet(walletAddress: string): Promise<User> {
  const supabase = createServiceRoleClient();
  const normalized = walletAddress.toLowerCase();

  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", normalized)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existing) {
    return existing as User;
  }

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({ wallet_address: normalized })
    .select("*")
    .single();

  if (insertError || !created) {
    throw new Error(insertError?.message ?? "Failed to create user");
  }

  return created as User;
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
  creatorId: string,
): Promise<Workspace> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      creator_id: creatorId,
      title: input.title,
      problem_statement: input.problemStatement,
      goal: input.goal,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create workspace");
  }

  return data as Workspace;
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<Workspace | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Workspace | null) ?? null;
}

export async function listWorkspacesByCreator(
  creatorId: string,
): Promise<Workspace[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Workspace[]) ?? [];
}

export { SESSION_COOKIE, WALLET_COOKIE };
