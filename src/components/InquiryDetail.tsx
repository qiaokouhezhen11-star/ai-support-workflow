"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Inquiry } from "@/types/inquiry";
import AiResultPanel from "./AiResultPanel";
import InternalNotePanel from "./InternalNotePanel";
import InquiryHistoryTimeline from "@/lib/InquiryHistoryTimeline";
import {
  getCategoryBadgeClass,
  getCategoryLabel,
  getPriorityBadgeClass,
  getPriorityLabel,
  getStatusBadgeClass,
  getStatusLabel,
} from "@/lib/inquiryLabels";

type Props = {
  inquiry: Inquiry;
};

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function formatDate(date: string) {
  return new Date(date).toLocaleString("ja-JP");
}

function infoCardTitleClass() {
  return "text-xs font-semibold uppercase tracking-wide text-slate-500";
}

function EmptyInfoCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <p className={infoCardTitleClass()}>{title}</p>
      <p className="mt-3 text-base font-bold text-slate-700">未設定</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {label}
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export default function InquiryDetail({ inquiry }: Props) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assigneeName, setAssigneeName] = useState(inquiry.assigneeName ?? "");
  const [tagsText, setTagsText] = useState((inquiry.tags ?? []).join(", "));
  const [assigneeSaving, setAssigneeSaving] = useState(false);
  const [tagsSaving, setTagsSaving] = useState(false);
  const [error, setError] = useState("");

  const hasAiResult = useMemo(() => {
    return Boolean(
      inquiry.category ||
        inquiry.priority ||
        inquiry.summary ||
        inquiry.draftReply ||
        inquiry.aiReason
    );
  }, [inquiry]);

  async function handleAnalyze() {
    if (isDemoMode) {
      setError("デモモードではAI解析を停止しています。ローカル環境でお試しください。");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiryId: inquiry.id,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `AI解析APIがJSONを返していません。status=${res.status}, body=${text.slice(0, 200)}`
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI解析に失敗しました。");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI解析に失敗しました。");
    } finally {
      setAnalyzing(false);
    }
  }

  async function updateStatus(status: Inquiry["status"]) {
    if (isDemoMode) {
      setError("デモモードではステータス更新を停止しています。");
      return;
    }

    setStatusUpdating(true);
    setError("");

    try {
      const res = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          actorName: assigneeName.trim() || inquiry.assigneeName || "担当者",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ステータス更新に失敗しました。");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ステータス更新に失敗しました。");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleAssigneeSave() {
    if (isDemoMode) {
      setError("デモモードでは担当者更新を停止しています。");
      return;
    }

    setAssigneeSaving(true);
    setError("");

    try {
      const normalized = assigneeName.trim();
      const res = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeName: normalized || null,
          actorName: normalized || inquiry.assigneeName || "担当者",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "担当者の更新に失敗しました。");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "担当者の更新に失敗しました。");
    } finally {
      setAssigneeSaving(false);
    }
  }

  async function handleTagsSave() {
    if (isDemoMode) {
      setError("デモモードではタグ更新を停止しています。");
      return;
    }

    setTagsSaving(true);
    setError("");

    try {
      const tags = Array.from(
        new Set(
          tagsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );

      const res = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tags,
          actorName: assigneeName.trim() || inquiry.assigneeName || "担当者",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "タグの更新に失敗しました。");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "タグの更新に失敗しました。");
    } finally {
      setTagsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {isDemoMode ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Vercelデモ環境では、AI解析や編集系の操作を停止しています。画面確認用の公開モードです。
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/60 px-6 py-6 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  問い合わせ詳細
                </span>

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                    inquiry.status
                  )}`}
                >
                  {getStatusLabel(inquiry.status)}
                </span>

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                    inquiry.priority
                  )}`}
                >
                  優先度: {getPriorityLabel(inquiry.priority)}
                </span>

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                    inquiry.category
                  )}`}
                >
                  カテゴリ: {getCategoryLabel(inquiry.category)}
                </span>
              </div>

              <h1 className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {inquiry.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                <p>
                  顧客名:{" "}
                  <span className="font-semibold text-slate-800">
                    {inquiry.customerName}
                  </span>
                </p>
                <p>
                  担当者:{" "}
                  <span className="font-semibold text-slate-800">
                    {inquiry.assigneeName ?? "未割り当て"}
                  </span>
                </p>
                <p>
                  問い合わせID:{" "}
                  <span className="font-mono text-slate-700">{inquiry.id}</span>
                </p>
                <p>
                  タグ数:{" "}
                  <span className="font-semibold text-slate-800">
                    {inquiry.tags?.length ?? 0}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className={infoCardTitleClass()}>作成日時</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(inquiry.createdAt)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className={infoCardTitleClass()}>更新日時</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(inquiry.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 md:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {inquiry.category ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className={infoCardTitleClass()}>カテゴリ</p>
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getCategoryBadgeClass(
                      inquiry.category
                    )}`}
                  >
                    {getCategoryLabel(inquiry.category)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  AI解析後に自動分類されたカテゴリを表示します。
                </p>
              </div>
            ) : (
              <EmptyInfoCard
                title="カテゴリ"
                body="AI解析を実行すると、問い合わせ内容に応じたカテゴリ候補を表示します。"
              />
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className={infoCardTitleClass()}>優先度</p>
              <p className="mt-3">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getPriorityBadgeClass(
                    inquiry.priority
                  )}`}
                >
                  {getPriorityLabel(inquiry.priority)}
                </span>
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                重要度に応じて色付きで見分けられるようにしています。
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className={infoCardTitleClass()}>担当者</p>
              <p className="mt-3 text-base font-bold text-slate-900">
                {inquiry.assigneeName ?? "未割り当て"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                一覧画面にも表示され、誰が対応するかを明確にできます。
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className={infoCardTitleClass()}>タグ</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(inquiry.tags ?? []).length > 0 ? (
                  inquiry.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-base font-bold text-slate-900">未設定</p>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                一覧から案件の性質を把握しやすくするための目印です。
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className={infoCardTitleClass()}>AI解析状況</p>
              <p className="mt-3 text-base font-bold text-slate-900">
                {hasAiResult ? "解析結果あり" : "未解析"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                要約・回答案・判定理由などの生成状況を表します。
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className={infoCardTitleClass()}>社内メモ件数</p>
              <p className="mt-3 text-base font-bold text-slate-900">
                {inquiry.commentCount ?? 0} 件
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                担当者間の引き継ぎや注意点を記録できます。
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">問い合わせ本文</h2>
                <p className="mt-1 text-sm text-slate-500">
                  実際に受け付けた内容をそのまま表示します。
                </p>
              </div>

              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                Record Preview
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {inquiry.inquiryBody}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-slate-800">
                    担当者アサイン
                  </label>
                  <input
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    disabled={isDemoMode}
                    placeholder="例: 佐藤"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    誰が対応する問い合わせかを明確にして、一覧から追いやすくします。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAssigneeSave}
                  disabled={assigneeSaving || isDemoMode}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDemoMode ? "デモモードでは保存停止中" : assigneeSaving ? "保存中..." : "担当者を保存"}
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-slate-800">
                    タグ付け
                  </label>
                  <input
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    disabled={isDemoMode}
                    placeholder="例: 請求, 返金確認, 高優先"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    カンマ区切りで複数入力できます。案件の特徴を一覧で見つけやすくします。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTagsSave}
                  disabled={tagsSaving || isDemoMode}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDemoMode ? "デモモードでは保存停止中" : tagsSaving ? "保存中..." : "タグを保存"}
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">操作</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    AI解析やステータス更新をここから実行します。
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                    inquiry.status
                  )}`}
                >
                  現在の状態: {getStatusLabel(inquiry.status)}
                </span>
              </div>

              {!hasAiResult ? (
                <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 py-4">
                  <p className="text-sm font-semibold text-blue-800">
                    まだAI解析結果はありません
                  </p>
                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    「AIで解析する」を押すと、カテゴリ・優先度・要約・回答案・判定理由を自動生成できます。
                  </p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || isDemoMode}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDemoMode ? "デモモードではAI解析停止中" : analyzing ? "AI解析中..." : "AIで解析する"}
                </button>

                <button
                  onClick={() => updateStatus("COMPLETED")}
                  disabled={statusUpdating || isDemoMode}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDemoMode ? "デモモードでは更新停止中" : statusUpdating ? "更新中..." : "完了にする"}
                </button>

                <button
                  onClick={() => updateStatus("OPEN")}
                  disabled={statusUpdating || isDemoMode}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDemoMode ? "デモモードでは更新停止中" : statusUpdating ? "更新中..." : "未対応に戻す"}
                </button>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">エラー</p>
                  <p className="mt-1 text-sm leading-6 text-red-600">{error}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <AiResultPanel
        inquiry={inquiry}
        actorName={assigneeName || inquiry.assigneeName}
        onSaved={() => router.refresh()}
      />

      <InternalNotePanel inquiryId={inquiry.id} />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-blue-50/60 px-6 py-6 md:px-8">
          <SectionHeader
            label="類似問い合わせ"
            title="似た問い合わせ候補"
            description="カテゴリ、優先度、タグの近さをもとに、参考になりそうな過去問い合わせを表示します。"
          />
        </div>

        <div className="px-6 py-6 md:px-8">
          {(inquiry.similarInquiries ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-800">
                参考になる類似問い合わせはまだありません
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                タグやカテゴリが増えると、より近い候補を出しやすくなります。
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {inquiry.similarInquiries?.map((item) => (
                <Link
                  key={item.id}
                  href={`/inquiries/${item.id}`}
                  className="block rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      一致度 {item.score} 点
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                        item.priority
                      )}`}
                    >
                      優先度: {getPriorityLabel(item.priority)}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{item.customerName}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>

                  {item.summary ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Summary
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{item.summary}</p>
                    </div>
                  ) : null}

                  {item.matchedTags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.matchedTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-lime-50/60 px-6 py-6 md:px-8">
          <SectionHeader
            label="ナレッジ候補"
            title="対応に役立つナレッジ候補"
            description="カテゴリ、優先度、タグ、現在の回答案、手動登録したナレッジをもとに、確認するとよい観点や対応メモを表示します。"
          />
        </div>

        <div className="px-6 py-6 md:px-8">
          {(inquiry.knowledgeSuggestions ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-800">
                表示できるナレッジ候補はまだありません
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {inquiry.knowledgeSuggestions?.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50/40 to-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {item.source === "rule"
                        ? "ルールベース"
                        : item.source === "manual"
                          ? "手動登録ナレッジ"
                          : "過去履歴ベース"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      信頼度: {item.confidence === "high" ? "高" : "中"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Suggestion
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 px-6 py-6 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                更新履歴
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                更新履歴（監査ログ風）
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                問い合わせの登録、AI解析、保存、ステータス更新などを時系列で見やすく整理しています。
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Latest Update
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(inquiry.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 md:px-8">
          <InquiryHistoryTimeline inquiry={inquiry} />
        </div>
      </section>
    </div>
  );
}
