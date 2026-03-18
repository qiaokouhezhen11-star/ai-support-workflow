"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InquiryComment } from "@/types/inquiry";

type Props = {
  inquiryId: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("ja-JP");
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
      <p className="text-sm font-semibold text-slate-800">まだ社内メモはありません</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        担当者間の申し送りや対応方針を残しておくと、管理画面らしさがぐっと上がります。
      </p>
    </div>
  );
}

function NoteCard({ comment }: { comment: InquiryComment }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {comment.authorName}
          </span>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {comment.body}
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Created At
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatDate(comment.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

async function parseApiResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `APIがJSONを返していません。status=${res.status}, body=${text.slice(0, 200)}`
    );
  }

  return res.json();
}

export default function InternalNotePanel({ inquiryId }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<InquiryComment[]>([]);
  const [authorName, setAuthorName] = useState("担当者");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const fetchComments = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/comments`, {
        cache: "no-store",
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "社内メモの取得に失敗しました。");
      }

      setComments(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "社内メモの取得に失敗しました。"
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPosting(true);
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorName,
          body,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "社内メモの保存に失敗しました。");
      }

      setBody("");
      setMessage("社内メモを追加しました。");
      setMessageType("success");
      await fetchComments();
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "社内メモの保存に失敗しました。"
      );
      setMessageType("error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-amber-50 via-white to-slate-50 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              社内メモ
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              担当者向けメモ・申し送り
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              顧客には見えない前提の内部メモです。対応方針、注意点、補足情報などを残せます。
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Notes
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {comments.length} 件
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 md:px-8">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div>
              <label className="text-sm font-semibold text-slate-800">担当者名</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="例: 山田"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                未入力の場合は「担当者」で保存されます。
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">メモ内容</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="例: 返金判断の可能性あり。利用状況を確認してから一次回答する。"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              />
            </div>
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
                {messageType === "success" ? "保存完了" : "エラー"}
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

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              社内の判断メモや申し送りを残しておくための欄です。
            </p>

            <button
              type="submit"
              disabled={posting}
              className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {posting ? "保存中..." : "社内メモを追加"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">社内メモを読み込み中です...</p>
            </div>
          ) : comments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <NoteCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
