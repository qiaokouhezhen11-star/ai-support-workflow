"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRole } from "@/components/RoleProvider";
import type { InquiryAttachment } from "@/types/inquiry";

type Props = {
  inquiryId: string;
  attachments: InquiryAttachment[];
  uploadedBy?: string | null;
};

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function formatDate(value: string) {
  return new Date(value).toLocaleString("ja-JP");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round((bytes / 1024) * 10) / 10} KB`;
  }

  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

export default function InquiryAttachmentPanel({
  inquiryId,
  attachments,
  uploadedBy,
}: Props) {
  const router = useRouter();
  const { can, roleLabel } = useRole();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const canManageAttachments = can("manageAttachments");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isDemoMode) {
      setMessage("デモモードでは添付ファイルの登録を停止しています。");
      setMessageType("error");
      return;
    }

    if (!canManageAttachments) {
      setMessage(`現在の権限（${roleLabel}）では添付ファイルを追加できません。`);
      setMessageType("error");
      return;
    }

    if (!file) {
      setMessage("添付ファイルを選択してください。");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadedBy", uploadedBy || "担当者");

      const res = await fetch(`/api/inquiries/${inquiryId}/attachments`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "添付ファイルの保存に失敗しました。");
      }

      setFile(null);
      setMessage("添付ファイルを追加しました。");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "添付ファイルの保存に失敗しました。"
      );
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachmentId: string) {
    if (isDemoMode) {
      setMessage("デモモードでは添付ファイルの削除を停止しています。");
      setMessageType("error");
      return;
    }

    if (!canManageAttachments) {
      setMessage(`現在の権限（${roleLabel}）では添付ファイルを削除できません。`);
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm("この添付ファイルを削除しますか？");
    if (!confirmed) {
      return;
    }

    setDeletingId(attachmentId);
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch(
        `/api/inquiries/${inquiryId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "添付ファイルの削除に失敗しました。");
      }

      setMessage("添付ファイルを削除しました。");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "添付ファイルの削除に失敗しました。"
      );
      setMessageType("error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-sky-50/60 px-6 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-indigo-600">添付ファイル</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">証跡や参考資料を添付する</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              スクリーンショットやPDFなどを添付して、対応時の確認材料として残せます。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Files
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{attachments.length} 件</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 md:px-8">
        <form onSubmit={handleUpload} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {!canManageAttachments ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              現在の権限（{roleLabel}）では添付ファイルの追加・削除はできません。
            </div>
          ) : null}

          <div className="mt-0 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-800">ファイルを選択</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={isDemoMode || !canManageAttachments}
                className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                1ファイルずつ、5MBまで追加できます。
              </p>
            </div>

            <button
              type="submit"
              disabled={uploading || isDemoMode || !canManageAttachments}
              className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDemoMode ? "デモモードでは追加停止中" : uploading ? "追加中..." : "添付ファイルを追加"}
            </button>
          </div>

          {message ? (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  messageType === "success" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {messageType === "success" ? "完了" : "エラー"}
              </p>
              <p
                className={`mt-1 text-sm leading-6 ${
                  messageType === "success" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {message}
              </p>
            </div>
          ) : null}
        </form>

        <div className="mt-5 space-y-4">
          {attachments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-800">まだ添付ファイルはありません</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                エラー画面のスクリーンショットや請求書PDFなどを添付すると、対応履歴として見栄えも良くなります。
              </p>
            </div>
          ) : (
            attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link
                      href={attachment.url}
                      target="_blank"
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600"
                    >
                      {attachment.fileName}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {attachment.mimeType ?? "種別不明"} / {formatFileSize(attachment.fileSize)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {attachment.uploadedBy} / {formatDate(attachment.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={attachment.url}
                      target="_blank"
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                    >
                      開く
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={deletingId === attachment.id || !canManageAttachments || isDemoMode}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === attachment.id ? "削除中..." : "削除"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
