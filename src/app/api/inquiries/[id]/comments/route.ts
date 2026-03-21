import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getReadOnlyDeploymentMessage,
  isReadOnlyDeployment,
} from "@/lib/deployMode";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const createCommentSchema = z.object({
  authorName: z
    .string()
    .trim()
    .max(50, "担当者名は50文字以内で入力してください。")
    .optional(),
  body: z
    .string()
    .trim()
    .min(1, "メモ内容は必須です。")
    .max(1000, "メモ内容は1000文字以内で入力してください。"),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "問い合わせが見つかりません。" },
        { status: 404 }
      );
    }

    const comments = await prisma.inquiryComment.findMany({
      where: { inquiryId: id },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/inquiries/[id]/comments error:", error);

    return NextResponse.json(
      { error: "社内メモの取得に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    if (isReadOnlyDeployment()) {
      return NextResponse.json(
        { error: getReadOnlyDeploymentMessage() },
        { status: 403 }
      );
    }

    const permission = await requirePermission("editInquiry");
    if (permission.response) {
      return permission.response;
    }

    const { id } = await context.params;
    const json = await req.json();
    const parsed = createCommentSchema.parse(json);

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "問い合わせが見つかりません。" },
        { status: 404 }
      );
    }

    const authorName = parsed.authorName?.trim() || "担当者";

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.inquiryComment.create({
        data: {
          inquiryId: id,
          authorName,
          body: parsed.body.trim(),
        },
      });

      await tx.inquiryAuditLog.create({
        data: {
          inquiryId: id,
          action: "COMMENT_ADDED",
          actorName: authorName,
          fieldName: "comment",
          afterValue: parsed.body.trim(),
          comment: "社内メモが追加されました。",
        },
      });

      return created;
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/inquiries/[id]/comments error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "入力値が不正です。" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "社内メモの保存に失敗しました。" },
      { status: 500 }
    );
  }
}
