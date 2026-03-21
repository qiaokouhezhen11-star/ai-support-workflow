import { NextResponse } from "next/server";
import { z } from "zod";
import { getRoleLabel, ROLE_COOKIE_NAME } from "@/lib/permissions-shared";

const sessionRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "AGENT", "VIEWER"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sessionRoleSchema.parse(body);

    const response = NextResponse.json({
      role: parsed.role,
      label: getRoleLabel(parsed.role),
    });

    response.cookies.set({
      name: ROLE_COOKIE_NAME,
      value: parsed.role,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "ロール指定が不正です。" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "ロール切り替えに失敗しました。" },
      { status: 500 }
    );
  }
}
