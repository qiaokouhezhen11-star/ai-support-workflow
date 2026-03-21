"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/RoleProvider";
import type { ReplyTemplate } from "@/types/inquiry";
import { getCategoryLabel, getPriorityLabel } from "@/lib/inquiryLabels";

type Props = {
  templates: ReplyTemplate[];
};

type MessageType = "success" | "error" | "";
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const categoryOptions = [
  { value: "", label: "指定なし" },
  { value: "GENERAL", label: "一般" },
  { value: "TROUBLESHOOTING", label: "不具合" },
  { value: "BILLING", label: "請求" },
  { value: "FEATURE_REQUEST", label: "機能要望" },
  { value: "OTHER", label: "その他" },
] as const;

const priorityOptions = [
  { value: "", label: "指定なし" },
  { value: "LOW", label: "低" },
  { value: "MEDIUM", label: "中" },
  { value: "HIGH", label: "高" },
  { value: "URGENT", label: "緊急" },
] as const;

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

function formatDate(value: string) {
  return new Date(value).toLocaleString("ja-JP");
}

export default function ReplyTemplateLibraryPanel({ templates }: Props) {
  const router = useRouter();
  const { can, roleLabel } = useRole();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [createdBy, setCreatedBy] = useState("担当者");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("");
  const canManageTemplates = can("manageTemplates");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isDemoMode) {
      setMessage("デモモードでは定型文登録を停止しています。");
      setMessageType("error");
      return;
    }

    if (!canManageTemplates) {
      setMessage(`現在の権限（${roleLabel}）では定型文登録できません。`);
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch("/api/reply-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          body,
          category: category || null,
          priority: priority || null,
          createdBy,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "定型文の登録に失敗しました。");
      }

      setTitle("");
      setDescription("");
      setBody("");
      setCategory("");
      setPriority("");
      setMessage("定型文を登録しました。詳細画面の回答案で使えます。");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "定型文の登録に失敗しました。"
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-600">返信テンプレート</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              定型文を登録する
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              AI回答案をゼロから作るだけでなく、一次返信の定型文を使い回せるようにします。
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Templates
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{templates.length} 件</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
        >
          {isDemoMode ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Vercelデモ環境では定型文の登録を停止しています。
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-800">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isDemoMode || !canManageTemplates}
                placeholder="例: 障害発生時の一次返信"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-800">用途メモ</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isDemoMode || !canManageTemplates}
                placeholder="例: ログイン障害で調査開始を伝える一次返信"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isDemoMode || !canManageTemplates}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {categoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">優先度</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isDemoMode || !canManageTemplates}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {priorityOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-800">本文</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isDemoMode || !canManageTemplates}
                rows={6}
                placeholder="例: お問い合わせありがとうございます。現在、状況を確認しております。進捗があり次第ご連絡いたします。"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">登録者名</label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                disabled={isDemoMode || !canManageTemplates}
                placeholder="例: 佐藤"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          {message ? (
            <div
              className={`rounded-2xl border px-4 py-3 ${
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
                {messageType === "success" ? "登録完了" : "エラー"}
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

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              登録した定型文は、問い合わせ詳細の回答案編集で `上書き` と `追記` に使えます。
            </p>
            <button
              type="submit"
              disabled={saving || isDemoMode || !canManageTemplates}
              className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDemoMode ? "デモモードでは登録停止中" : saving ? "登録中..." : "定型文を登録"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">登録済み定型文</h2>
        <p className="mt-1 text-sm text-slate-500">
          直近の定型文を確認できます。カテゴリや優先度を持たせることで、詳細画面で候補として出しやすくしています。
        </p>

        <div className="mt-6 space-y-4">
          {templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">まだ定型文はありません</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                まずは障害発生時の一次返信や、請求確認中の案内文から登録するのがおすすめです。
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {template.createdBy}
                  </span>
                  {template.category ? (
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                      {getCategoryLabel(template.category)}
                    </span>
                  ) : null}
                  {template.priority ? (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      優先度: {getPriorityLabel(template.priority)}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{template.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {template.description}
                </p>
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                  {template.body}
                </p>
                <p className="mt-3 text-xs text-slate-500">{formatDate(template.updatedAt)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
