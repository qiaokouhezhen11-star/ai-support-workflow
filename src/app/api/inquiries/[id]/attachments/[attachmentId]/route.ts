import { unlink } from "node:fs/promises";
import path from "node:path";
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
    attachmentId: string;
  }>;
};

type AttachmentRecord = {
  id: string;
  inquiryId: string;
  fileName: string;
  url: string;
  uploadedBy: string;
};

type AttachmentClient = {
  findFirst: (args: {
    where: {
      id: string;
      inquiryId: string;
    };
  }) => Promise<AttachmentRecord | null>;
  delete: (args: {
    where: {
      id: string;
    };
  }) => Promise<unknown>;
};

export async function DELETE(_req: Request, context: RouteContext) {
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

    const { id, attachmentId } = await context.params;
    const attachmentClient = (prisma as unknown as {
      inquiryAttachment: AttachmentClient;
    }).inquiryAttachment;
    const attachment = await attachmentClient.findFirst({
      where: {
        id: attachmentId,
        inquiryId: id,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "添付ファイルが見つかりません。" },
        { status: 404 }
      );
    }

    const fullPath = path.join(process.cwd(), "public", attachment.url);

    await prisma.$transaction(async (tx) => {
      const transactionAttachmentClient = (tx as unknown as {
        inquiryAttachment: AttachmentClient;
      }).inquiryAttachment;

      await transactionAttachmentClient.delete({
        where: { id: attachmentId },
      });

      await tx.inquiryAuditLog.create({
        data: {
          inquiryId: id,
          action: "FIELD_UPDATED",
          actorName: attachment.uploadedBy,
          fieldName: "attachment",
          beforeValue: attachment.fileName,
          afterValue: null,
          comment: "添付ファイルを削除しました。",
        },
      });
    });

    try {
      await unlink(fullPath);
    } catch {
      // ファイルがすでに無い場合でもDB削除は成功扱いにする
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "添付ファイルの削除に失敗しました。" },
      { status: 500 }
    );
  }
}
