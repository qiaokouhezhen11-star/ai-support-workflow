import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getReadOnlyDeploymentMessage,
  isReadOnlyDeployment,
} from "@/lib/deployMode";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const createReplyTemplateSchema = z.object({
  title: z.string().trim().min(1, "タイトルは必須です。"),
  description: z.string().trim().min(1, "用途メモは必須です。"),
  body: z.string().trim().min(1, "本文は必須です。"),
  category: z
    .enum(["GENERAL", "TROUBLESHOOTING", "BILLING", "FEATURE_REQUEST", "OTHER"])
    .nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).nullable(),
  createdBy: z.string().trim().min(1, "登録者名は必須です。").max(50),
});

export async function GET() {
  const templates = await prisma.replyTemplate.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  try {
    if (isReadOnlyDeployment()) {
      return NextResponse.json(
        { error: getReadOnlyDeploymentMessage() },
        { status: 403 }
      );
    }

    const permission = await requirePermission("manageTemplates");
    if (permission.response) {
      return permission.response;
    }

    const body = await req.json();
    const parsed = createReplyTemplateSchema.parse(body);

    const template = await prisma.replyTemplate.create({
      data: parsed,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "入力値が不正です。" },
        { status: 400 }
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "定型文の登録に失敗しました。" },
      { status: 500 }
    );
  }
}
