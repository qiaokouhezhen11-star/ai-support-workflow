import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getReadOnlyDeploymentMessage,
  isReadOnlyDeployment,
} from "@/lib/deployMode";
import { prisma } from "@/lib/prisma";

const updateCommentSchema = z.object({
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
    commentId: string;
  }>;
};

async function getCommentOrError(inquiryId: string, commentId: string) {
  return prisma.inquiryComment.findFirst({
    where: {
      id: commentId,
      inquiryId,
    },
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    if (isReadOnlyDeployment()) {
      return NextResponse.json(
        { error: getReadOnlyDeploymentMessage() },
        { status: 403 }
      );
    }

    const { id, commentId } = await context.params;
    const json = await req.json();
    const parsed = updateCommentSchema.parse(json);
    const current = await getCommentOrError(id, commentId);

    if (!current) {
      return NextResponse.json(
        { error: "社内メモが見つかりません。" },
        { status: 404 }
      );
    }

    const authorName = parsed.authorName?.trim() || "担当者";
    const body = parsed.body.trim();

    const updated = await prisma.$transaction(async (tx) => {
      const comment = await tx.inquiryComment.update({
        where: { id: commentId },
        data: {
          authorName,
          body,
        },
      });

      await tx.inquiryAuditLog.create({
        data: {
          inquiryId: id,
          action: "FIELD_UPDATED",
          actorName: authorName,
          fieldName: "comment",
          beforeValue: current.body,
          afterValue: body,
          comment: "社内メモが更新されました。",
        },
      });

      return comment;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/inquiries/[id]/comments/[commentId] error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "入力値が不正です。" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "社内メモの更新に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    if (isReadOnlyDeployment()) {
      return NextResponse.json(
        { error: getReadOnlyDeploymentMessage() },
        { status: 403 }
      );
    }

    const { id, commentId } = await context.params;
    const current = await getCommentOrError(id, commentId);

    if (!current) {
      return NextResponse.json(
        { error: "社内メモが見つかりません。" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.inquiryComment.delete({
        where: { id: commentId },
      });

      await tx.inquiryAuditLog.create({
        data: {
          inquiryId: id,
          action: "FIELD_UPDATED",
          actorName: current.authorName,
          fieldName: "comment",
          beforeValue: current.body,
          afterValue: null,
          comment: "社内メモが削除されました。",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/inquiries/[id]/comments/[commentId] error:", error);

    return NextResponse.json(
      { error: "社内メモの削除に失敗しました。" },
      { status: 500 }
    );
  }
}
