import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getReadOnlyDeploymentMessage,
  isReadOnlyDeployment,
} from "@/lib/deployMode";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type AttachmentDelegate = {
  create: (args: {
    data: {
      inquiryId: string;
      fileName: string;
      mimeType: string | null;
      fileSize: number;
      url: string;
      uploadedBy: string;
    };
  }) => Promise<unknown>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    if (isReadOnlyDeployment()) {
      return NextResponse.json(
        { error: getReadOnlyDeploymentMessage() },
        { status: 403 }
      );
    }

    const permission = await requirePermission("manageAttachments");
    if (permission.response) {
      return permission.response;
    }

    const { id } = await context.params;
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: { id: true, assigneeName: true },
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "問い合わせが見つかりません。" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const uploadedBy =
      String(formData.get("uploadedBy") || "").trim() ||
      inquiry.assigneeName ||
      "担当者";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "添付ファイルが選択されていません。" },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "空のファイルは添付できません。" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "添付ファイルは5MB以下にしてください。" },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const fileName = `${randomUUID()}-${safeName}`;
    const relativeDir = path.join("uploads", "inquiries", id);
    const fullDir = path.join(process.cwd(), "public", relativeDir);
    await mkdir(fullDir, { recursive: true });

    const fullPath = path.join(fullDir, fileName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, bytes);

    const url = `/${path.posix.join(relativeDir.replaceAll(path.sep, "/"), fileName)}`;

    const attachment = await prisma.$transaction(async (tx) => {
      const attachmentClient = (tx as unknown as { inquiryAttachment: AttachmentDelegate })
        .inquiryAttachment;
      const created = await attachmentClient.create({
        data: {
          inquiryId: id,
          fileName: file.name,
          mimeType: file.type || null,
          fileSize: file.size,
          url,
          uploadedBy,
        },
      });

      await tx.inquiryAuditLog.create({
        data: {
          inquiryId: id,
          action: "FIELD_UPDATED",
          actorName: uploadedBy,
          fieldName: "attachment",
          beforeValue: null,
          afterValue: file.name,
          comment: "添付ファイルを追加しました。",
        },
      });

      return created;
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "添付ファイルの保存に失敗しました。" },
      { status: 500 }
    );
  }
}
