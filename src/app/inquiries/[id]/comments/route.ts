import { NextResponse } from "next/server";
import { z } from "zod";
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

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Props) {
  try {
    const { id } = await params;

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
    console.error(error);

    return NextResponse.json(
      { error: "社内メモの取得に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = createCommentSchema.parse(body);

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

    const comment = await prisma.inquiryComment.create({
      data: {
        inquiryId: id,
        authorName: parsed.authorName?.trim() || "担当者",
        body: parsed.body.trim(),
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(error);

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