"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KnowledgeArticle } from "@/types/inquiry";
import { getCategoryLabel, getPriorityLabel } from "@/lib/inquiryLabels";

type Props = {
  articles: KnowledgeArticle[];
};

type MessageType = "success" | "error" | "";

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

function parseCsv(text: string) {
  return Array.from(
    new Set(
      text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ja-JP");
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

export default function KnowledgeLibraryPanel({ articles }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [createdBy, setCreatedBy] = useState("担当者");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          summary,
          content,
          category: category || null,
          priority: priority || null,
          tags: parseCsv(tagsText),
          keywords: parseCsv(keywordsText),
          createdBy,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "ナレッジの登録に失敗しました。");
      }

      setTitle("");
      setSummary("");
      setContent("");
      setCategory("");
      setPriority("");
      setTagsText("");
      setKeywordsText("");
      setMessage("ナレッジを登録しました。詳細画面の候補にも反映されます。");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ナレッジの登録に失敗しました。"
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">ナレッジ運用</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              手動ナレッジを登録する
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              AIを追加で呼ばずに、社内で蓄積した確認観点や一次回答メモを候補として再利用できます。
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Articles
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{articles.length} 件</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-800">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 請求差異の一次確認テンプレート"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-800">要点</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="例: 請求書と管理画面の金額がずれるときに確認する項目です。"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                {priorityOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">タグ</label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="例: 請求, 返金確認"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">補助キーワード</label>
              <input
                type="text"
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                placeholder="例: 二重請求, 差額, 明細"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-800">本文</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="例: 対象月、契約プラン、割引・返金・調整額、決済代行ログを確認します。"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">登録者名</label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="例: 佐藤"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
              登録したナレッジは、カテゴリやタグが近い問い合わせで候補表示されます。
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "登録中..." : "ナレッジを登録"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">登録済みナレッジ</h2>
        <p className="mt-1 text-sm text-slate-500">
          直近に追加されたナレッジを確認できます。見せ方としてもポートフォリオ映えしやすい部分です。
        </p>

        <div className="mt-6 space-y-4">
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">まだナレッジはありません</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                まずは請求対応やログイン障害の確認手順を1件ずつ入れるのがおすすめです。
              </p>
            </div>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {article.createdBy}
                  </span>
                  {article.category ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {getCategoryLabel(article.category)}
                    </span>
                  ) : null}
                  {article.priority ? (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      優先度: {getPriorityLabel(article.priority)}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{article.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{article.summary}</p>
                {article.tagsText ? (
                  <p className="mt-3 text-xs text-slate-500">タグ: {article.tagsText}</p>
                ) : null}
                <p className="mt-3 text-xs text-slate-500">{formatDate(article.updatedAt)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
