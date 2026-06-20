import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  upsertUserByWallet,
  WALLET_COOKIE,
} from "@/server/services/workspace.service";

const mockLoginSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export async function POST(request: Request) {
  if (process.env.MOCK_SIWE !== "true") {
    return NextResponse.json(
      { error: "Mock auth disabled — use SIWE in Phase 3" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = mockLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await upsertUserByWallet(parsed.data.address);
    const response = NextResponse.json({
      userId: user.id,
      walletAddress: user.wallet_address,
    });

    response.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set(WALLET_COOKIE, user.wallet_address, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(WALLET_COOKIE);
  return response;
}
